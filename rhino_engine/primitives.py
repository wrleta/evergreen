# -*- coding: utf-8 -*-
"""
rhino_engine.primitives — Low-level Rhino geometry creation.

All functions operate via rhinoscriptsyntax (IronPython 2.7 safe).
No project-specific data — pure geometry helpers.
"""
import math

import Rhino
import System
import System.Drawing as SD
import rhinoscriptsyntax as rs
import scriptcontext as sc


# ── Solid creation ───────────────────────────────────────────────────────────

def make_solid(pts2d, z0, z1):
    """Extrude a 2D polygon (list of (x,y) tuples) into a capped solid from z0 to z1.

    Returns the Rhino object GUID or None on failure.
    """
    pts3d = [(p[0], p[1], z0) for p in pts2d]
    pts3d.append(pts3d[0])
    polyline = rs.AddPolyline(pts3d)
    if not polyline:
        return None
    solid = rs.ExtrudeCurveStraight(polyline, (0, 0, z0), (0, 0, z1))
    rs.DeleteObject(polyline)
    if not solid:
        return None
    rs.CapPlanarHoles(solid)
    return solid


def box(pts2d, z0, z1):
    """Alias for make_solid — extrude arbitrary 2D polygon."""
    return make_solid(pts2d, z0, z1)


def rect_box(x0, y0, x1, y1, z0, z1, layer=None):
    """Create an axis-aligned rectangular box. Optionally assign to a layer."""
    obj = make_solid([(x0, y0), (x1, y0), (x1, y1), (x0, y1)], z0, z1)
    if obj and layer:
        rs.ObjectLayer(obj, layer)
    return obj


def wall_from_centerline(p1, p2, thickness, z0, z1, layer=None):
    """Create a wall solid from a centerline (p1→p2) with given thickness.

    The wall is offset equally on both sides of the centerline.
    p1, p2: (x, y) tuples. Returns Rhino GUID or None.
    """
    dx, dy = p2[0] - p1[0], p2[1] - p1[1]
    length = math.sqrt(dx * dx + dy * dy)
    if length < 0.1:
        return None
    nx = -dy / length * thickness / 2.0
    ny = dx / length * thickness / 2.0
    pts = [
        (p1[0] - nx, p1[1] - ny), (p2[0] - nx, p2[1] - ny),
        (p2[0] + nx, p2[1] + ny), (p1[0] + nx, p1[1] + ny),
    ]
    obj = make_solid(pts, z0, z1)
    if obj and layer:
        rs.ObjectLayer(obj, layer)
    return obj


# ── Boolean operations ───────────────────────────────────────────────────────

def object_brep(obj_id):
    """Convert a Rhino object to a Brep for boolean operations."""
    rh_obj = sc.doc.Objects.FindId(obj_id)
    if not rh_obj:
        return None
    geom = rh_obj.Geometry
    if isinstance(geom, Rhino.Geometry.Extrusion):
        return geom.ToBrep()
    return Rhino.Geometry.Brep.TryConvertBrep(geom)


def solid_difference(target_id, cutter_id):
    """Boolean-subtract cutter from target. Deletes both originals.

    Returns list of new object GUIDs, or None on failure.
    Retries at 2x tolerance if first attempt fails.
    """
    t_obj = sc.doc.Objects.FindId(target_id)
    c_obj = sc.doc.Objects.FindId(cutter_id)
    if not t_obj or not c_obj:
        return None
    t_brep = object_brep(target_id)
    c_brep = object_brep(cutter_id)
    if not t_brep or not c_brep:
        return None
    t_brep.Faces.SplitKinkyFaces(Rhino.RhinoMath.DefaultAngleTolerance, True)
    c_brep.Faces.SplitKinkyFaces(Rhino.RhinoMath.DefaultAngleTolerance, True)
    if t_brep.SolidOrientation == Rhino.Geometry.BrepSolidOrientation.Inward:
        t_brep.Flip()
    if c_brep.SolidOrientation == Rhino.Geometry.BrepSolidOrientation.Inward:
        c_brep.Flip()
    tol = sc.doc.ModelAbsoluteTolerance
    result = Rhino.Geometry.Brep.CreateBooleanDifference([t_brep], [c_brep], tol)
    if not result:
        result = Rhino.Geometry.Brep.CreateBooleanDifference([t_brep], [c_brep], tol * 2.0)
    if not result:
        return None
    attrs = t_obj.Attributes.Duplicate()
    sc.doc.Objects.Delete(target_id, True)
    sc.doc.Objects.Delete(cutter_id, True)
    new_ids = []
    for brep in result:
        nid = sc.doc.Objects.AddBrep(brep, attrs)
        if nid != System.Guid.Empty:
            new_ids.append(nid)
    return new_ids


# ── View capture ─────────────────────────────────────────────────────────────

def capture(output_path, view_type="Top", zoom=None, shaded=False, width=2400, height=1600):
    """Capture the current Rhino viewport to a PNG file.

    Args:
        output_path: Full path to save the PNG.
        view_type: "Top", "Front", "Right", "Perspective", or a named viewport.
        zoom: Optional (x0, y0, x1, y1) tuple for zoom window.
        shaded: If True, force shaded display mode.
        width, height: Output image dimensions.
    """
    matched = None
    for vn in rs.ViewNames():
        if vn == view_type or view_type in vn:
            matched = vn
            break
    if matched:
        rs.CurrentView(matched)
    else:
        view_commands = {
            "Top": "_-SetView _World _Top",
            "Front": "_-SetView _World _Front",
            "Right": "_-SetView _World _Right",
            "Perspective": "_-SetView _World _Perspective",
        }
        cmd = view_commands.get(view_type)
        if cmd:
            rs.Command(cmd, False)
    if view_type == "Perspective" or shaded:
        rs.Command("_SetDisplayMode _Shaded", False)
    else:
        rs.Command("_SetDisplayMode _Wireframe", False)
    if zoom:
        rs.Command("_Zoom _Window %f,%f %f,%f _Enter" % zoom, False)
    else:
        rs.ZoomExtents()
    rs.Sleep(300)
    view = Rhino.RhinoDoc.ActiveDoc.Views.ActiveView
    if view:
        bmp = view.CaptureToBitmap(SD.Size(width, height))
        if bmp:
            bmp.Save(output_path, SD.Imaging.ImageFormat.Png)
            bmp.Dispose()

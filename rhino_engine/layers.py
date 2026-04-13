# -*- coding: utf-8 -*-
"""
rhino_engine.layers — Layer management and scene setup.

Provides configurable layer creation, cleanup, and object management.
Layer definitions come from a dict, not hardcoded constants.
"""
import rhinoscriptsyntax as rs


# ── Default layer palettes ───────────────────────────────────────────────────

BASEMENT_LAYERS = {
    "Bsmt::Wall::Exterior": (120, 115, 105),
    "Bsmt::Wall::Interior": (170, 170, 160),
    "Bsmt::Wall::Struct": (140, 130, 110),
    "Bsmt::Wall::Crawl": (176, 108, 98),
    "Bsmt::Wall::Demo": (180, 140, 140),
    "Bsmt::Opening::Window": (0, 200, 255),
    "Bsmt::Opening::Door": (210, 0, 255),
    "Bsmt::Opening::Slider": (140, 0, 255),
    "Bsmt::Opening::Condition": (160, 110, 0),
    "Bsmt::Opening::Removed": (255, 150, 0),
    "Bsmt::Slab": (220, 220, 215),
    "Bsmt::Slab::Crawl": (235, 228, 210),
    "Bsmt::Stair": (205, 150, 255),
    "Bsmt::Beam": (150, 120, 70),
    "Bsmt::Post": (190, 110, 110),
    "Bsmt::Footing::Strip": (170, 155, 120),
    "Bsmt::Footing::Pad": (205, 170, 110),
    "Bsmt::Footing::Step": (180, 140, 100),
    "Bsmt::Areaway": (110, 140, 110),
    "Bsmt::Glazing": (100, 180, 255),
    "Bsmt::Door::Panel": (160, 120, 80),
    "Bsmt::Threshold": (180, 170, 150),
}

FIRST_FLOOR_LAYERS = {
    "1st::Wall::Exterior": (130, 125, 115),
    "1st::Wall::Interior": (180, 180, 170),
    "1st::Wall::Struct": (150, 140, 120),
    "1st::Opening::Window": (0, 200, 255),
    "1st::Opening::Door": (210, 0, 255),
    "1st::Slab": (220, 220, 215),
}

MARKUP_LAYERS = {
    "Markup::Outer": (255, 40, 40),
    "Markup::Inner": (40, 200, 40),
    "Markup::Seg": (160, 60, 60),
    "Markup::Fdn": (0, 200, 200),
    "Markup::Framed::Exist": (80, 130, 255),
    "Markup::Framed::New": (100, 220, 50),
    "Markup::Struct": (255, 160, 0),
    "Markup::Demo": (255, 0, 255),
}


# ── Layer operations ─────────────────────────────────────────────────────────

def setup_layers(layer_dict):
    """Create layers from a {name: (r, g, b)} dict. All visible and unlocked."""
    for name, rgb in layer_dict.items():
        rs.AddLayer(name, rs.CreateColor(rgb[0], rgb[1], rgb[2]))
        rs.LayerVisible(name, True)
        rs.LayerLocked(name, False)


def clear_layers(layer_names, preserve=None):
    """Delete all objects on the given layers. Optionally preserve specific layers.

    Args:
        layer_names: List of layer names to clear (or "all" for all layers).
        preserve: Set of layer names to skip (e.g. {"Ref::Plan"}).
    """
    preserve = preserve or set()

    if layer_names == "all":
        layer_names = rs.LayerNames()

    for name in layer_names:
        if name in preserve:
            continue
        if rs.IsLayer(name):
            rs.LayerLocked(name, False)
            objs = rs.ObjectsByLayer(name)
            if objs:
                rs.DeleteObjects(objs)


def layer_audit():
    """Return dict of {layer_name: object_count} for all non-empty layers."""
    audit = {}
    for name in sorted(rs.LayerNames()):
        objs = rs.ObjectsByLayer(name)
        if objs:
            audit[name] = len(objs)
    return audit


def hide_layers(names):
    """Hide a list of layers (by name). Silently skips non-existent layers."""
    for name in names:
        if rs.IsLayer(name):
            rs.LayerVisible(name, False)


def show_layers(names):
    """Show a list of layers. Silently skips non-existent layers."""
    for name in names:
        if rs.IsLayer(name):
            rs.LayerVisible(name, True)

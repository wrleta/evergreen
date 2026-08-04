# -*- coding: utf-8 -*-
"""
rhino_engine.config_validator -- Minimal JSON Schema (Draft 7) validator.

Supports: type, required, properties, items, additionalProperties,
          enum, exclusiveMinimum, minimum, maximum, minItems, maxItems.

Does NOT support: $ref, anyOf, oneOf, allOf, patternProperties, if/then/else.

Used to validate project_config.json against project_config_schema.json.
IronPython 2.7 compatible.
"""

try:
    string_types = basestring   # Python 2 / IronPython
except NameError:
    string_types = str          # Python 3


def validate(instance, schema, path=""):
    """Validate instance against schema.

    Returns a list of error strings (empty list = valid).
    """
    errors = []

    schema_type = schema.get("type")
    if schema_type is not None:
        if not _check_type(instance, schema_type):
            errors.append(
                "%s: expected type '%s', got '%s'" % (
                    path or "<root>", schema_type, type(instance).__name__
                )
            )
            return errors  # further checks would be meaningless

    if schema_type == "object" or isinstance(instance, dict):
        errors.extend(_validate_object(instance, schema, path))

    elif schema_type == "array" or isinstance(instance, list):
        errors.extend(_validate_array(instance, schema, path))

    elif schema_type in ("number", "integer") or isinstance(instance, (int, float)):
        if not isinstance(instance, bool):
            errors.extend(_validate_numeric(instance, schema, path))

    # Enum check applies to any type
    enum_vals = schema.get("enum")
    if enum_vals is not None and instance not in enum_vals:
        errors.append(
            "%s: value %r not in enum %r" % (path or "<root>", instance, enum_vals)
        )

    return errors


def _validate_object(instance, schema, path):
    errors = []
    if not isinstance(instance, dict):
        return errors

    # Required fields
    for field in schema.get("required", []):
        if field not in instance:
            errors.append(
                "%s: missing required field '%s'" % (path or "<root>", field)
            )

    # Defined properties
    props = schema.get("properties", {})
    for key, sub_schema in props.items():
        if key in instance:
            sub_path = ("%s.%s" % (path, key)) if path else key
            errors.extend(validate(instance[key], sub_schema, sub_path))

    # additionalProperties
    add_props = schema.get("additionalProperties")
    if isinstance(add_props, dict):
        defined = set(props.keys())
        for key, val in instance.items():
            if key not in defined:
                sub_path = ("%s.%s" % (path, key)) if path else key
                errors.extend(validate(val, add_props, sub_path))
    elif add_props is False:
        defined = set(props.keys())
        extra = [k for k in instance if k not in defined]
        if extra:
            errors.append(
                "%s: additional properties not allowed: %s" % (
                    path or "<root>", extra
                )
            )

    return errors


def _validate_array(instance, schema, path):
    errors = []
    if not isinstance(instance, list):
        return errors

    count = len(instance)
    min_items = schema.get("minItems")
    max_items = schema.get("maxItems")

    if min_items is not None and count < min_items:
        errors.append(
            "%s: array has %d items, minimum is %d" % (path or "<root>", count, min_items)
        )
    if max_items is not None and count > max_items:
        errors.append(
            "%s: array has %d items, maximum is %d" % (path or "<root>", count, max_items)
        )

    items_schema = schema.get("items")
    if items_schema is not None:
        for i, item in enumerate(instance):
            sub_path = "%s[%d]" % (path or "<root>", i)
            errors.extend(validate(item, items_schema, sub_path))

    return errors


def _validate_numeric(instance, schema, path):
    errors = []

    minimum = schema.get("minimum")
    maximum = schema.get("maximum")
    exc_min = schema.get("exclusiveMinimum")
    exc_max = schema.get("exclusiveMaximum")

    if minimum is not None and instance < minimum:
        errors.append(
            "%s: %s < minimum %s" % (path or "<root>", instance, minimum)
        )
    if maximum is not None and instance > maximum:
        errors.append(
            "%s: %s > maximum %s" % (path or "<root>", instance, maximum)
        )
    # Draft 7: exclusiveMinimum/Maximum are numeric thresholds
    if isinstance(exc_min, (int, float)) and instance <= exc_min:
        errors.append(
            "%s: %s must be > %s (exclusiveMinimum)" % (path or "<root>", instance, exc_min)
        )
    if isinstance(exc_max, (int, float)) and instance >= exc_max:
        errors.append(
            "%s: %s must be < %s (exclusiveMaximum)" % (path or "<root>", instance, exc_max)
        )

    return errors


def _check_type(value, type_str):
    if isinstance(value, bool):
        # bool is a subclass of int in Python; only matches "boolean"
        return type_str == "boolean"
    if type_str == "object":
        return isinstance(value, dict)
    if type_str == "array":
        return isinstance(value, list)
    if type_str == "string":
        return isinstance(value, string_types)
    if type_str == "number":
        return isinstance(value, (int, float))
    if type_str == "integer":
        return isinstance(value, int)
    if type_str == "boolean":
        return isinstance(value, bool)
    if type_str == "null":
        return value is None
    return True  # unknown type: pass through

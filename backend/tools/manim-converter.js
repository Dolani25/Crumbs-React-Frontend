
/**
 * Adapts py2ts.cjs functionality for use as a backend library.
 * Converts Python Manim scripts to ManimWeb JavaScript/TypeScript.
 */

const fs = require('fs');
const path = require('path');

// ─── Snake → camelCase ───────────────────────────────────────────────
function snakeToCamel(s) {
    return s.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}

// ─── Known Manim class name mapping (Python → TS) ───────────────────
const CLASS_MAP = {
    // Core
    'Scene': 'Scene',
    'Mobject': 'Mobject',
    'VMobject': 'VMobject',
    'VGroup': 'VGroup',
    'Group': 'Group',

    // Geometry
    'Circle': 'Circle',
    'Square': 'Square',
    'Rectangle': 'Rectangle',
    'Line': 'Line',
    'Arrow': 'Arrow',
    'DoubleArrow': 'DoubleArrow',
    'Vector': 'Vector',
    'Dot': 'Dot',
    'SmallDot': 'SmallDot',
    'Polygon': 'Polygon',
    'RegularPolygon': 'RegularPolygon',
    'Triangle': 'Triangle',
    'Arc': 'Arc',
    'ArcBetweenPoints': 'ArcBetweenPoints',
    'Ellipse': 'Ellipse',
    'Annulus': 'Annulus',
    'Sector': 'Sector',
    'DashedLine': 'DashedLine',
    'DashedVMobject': 'DashedVMobject',
    'CubicBezier': 'CubicBezier',
    'RoundedRectangle': 'RoundedRectangle',
    'Star': 'Star',
    'Angle': 'Angle',
    'RightAngle': 'RightAngle',
    'BackgroundRectangle': 'BackgroundRectangle',
    'SurroundingRectangle': 'SurroundingRectangle',
    'Brace': 'Brace',
    'BraceBetweenPoints': 'BraceBetweenPoints',
    'Cross': 'Cross',
    'Underline': 'Underline',

    // Text
    'Text': 'Text',
    'MathTex': 'MathTex',
    'Tex': 'Tex',
    'DecimalNumber': 'DecimalNumber',
    'Integer': 'Integer',
    'Variable': 'Variable',
    'Code': 'Code',
    'BulletedList': 'BulletedList',
    'Title': 'Title',
    'Paragraph': 'Paragraph',
    'MarkupText': 'MarkupText',

    // Graphing
    'Axes': 'Axes',
    'NumberPlane': 'NumberPlane',
    'NumberLine': 'NumberLine',
    'FunctionGraph': 'FunctionGraph',
    'ParametricFunction': 'ParametricFunction',
    'BarChart': 'BarChart',
    'ComplexPlane': 'ComplexPlane',

    // Camera
    'MovingCameraScene': 'Scene',

    // 3D
    'ThreeDScene': 'Scene',
    'Surface': 'ParametricSurface',
    'Sphere': 'Sphere',
    'Cube': 'Cube',
    'Cylinder': 'Cylinder',
    'Cone': 'Cone',
    'Torus': 'Torus',
    'Prism': 'Prism',
    'Arrow3D': 'Arrow3D',
    'Line3D': 'Line3D',
    'Dot3D': 'Dot3D',
    'ThreeDAxes': 'ThreeDAxes',

    // Tables / Matrix
    'Matrix': 'Matrix',
    'IntegerMatrix': 'IntegerMatrix',
    'DecimalMatrix': 'DecimalMatrix',
    'Table': 'Table',
    'MathTable': 'MathTable',

    // Animations — Creation
    'Create': 'Create',
    'Uncreate': 'Uncreate',
    'DrawBorderThenFill': 'DrawBorderThenFill',
    'Write': 'Write',
    'Unwrite': 'Unwrite',
    'AddTextLetterByLetter': 'AddTextLetterByLetter',
    'RemoveTextLetterByLetter': 'RemoveTextLetterByLetter',
    'ShowCreation': 'Create',

    // Animations — Fading
    'FadeIn': 'FadeIn',
    'FadeOut': 'FadeOut',

    // Animations — Transform
    'Transform': 'Transform',
    'ReplacementTransform': 'ReplacementTransform',
    'TransformFromCopy': 'TransformFromCopy',
    'ClockwiseTransform': 'ClockwiseTransform',
    'CounterclockwiseTransform': 'CounterclockwiseTransform',
    'MoveToTarget': 'MoveToTarget',
    'ApplyMethod': 'ApplyMethod',
    'ApplyFunction': 'ApplyFunction',
    'FadeTransform': 'FadeTransform',
    'Swap': 'Swap',
    'CyclicReplace': 'CyclicReplace',
    'Restore': 'Restore',
    'ScaleInPlace': 'ScaleInPlace',
    'ShrinkToCenter': 'ShrinkToCenter',

    // Animations — Movement
    'Shift': 'Shift',
    'Rotate': 'Rotate',
    'GrowFromCenter': 'GrowFromCenter',
    'GrowArrow': 'GrowArrow',
    'GrowFromEdge': 'GrowFromEdge',
    'GrowFromPoint': 'GrowFromPoint',
    'SpinInFromNothing': 'SpinInFromNothing',
    'MoveAlongPath': 'MoveAlongPath',

    // Animations — Indication
    'Indicate': 'Indicate',
    'Flash': 'Flash',
    'Circumscribe': 'Circumscribe',
    'Wiggle': 'Wiggle',
    'ShowPassingFlash': 'ShowPassingFlash',
    'ApplyWave': 'ApplyWave',
    'FocusOn': 'FocusOn',
    'Pulse': 'Pulse',

    // Animations — Composition
    'AnimationGroup': 'AnimationGroup',
    'LaggedStart': 'LaggedStart',
    'LaggedStartMap': 'LaggedStartMap',
    'Succession': 'Succession',

    // Animations — Updater
    'UpdateFromFunc': 'UpdateFromFunc',
    'UpdateFromAlphaFunc': 'UpdateFromAlphaFunc',

    // Animations — Utility
    'Rotating': 'Rotating',
    'Broadcast': 'Broadcast',

    // Misc
    'ValueTracker': 'ValueTracker',
    'ImageMobject': 'ImageMobject',
    'SVGMobject': 'SVGMobject',
    'Point': 'Point',
};

// Animation classes (need `new` keyword when called)
const ANIMATION_CLASSES = new Set([
    'Create', 'Uncreate', 'DrawBorderThenFill', 'Write', 'Unwrite',
    'AddTextLetterByLetter', 'RemoveTextLetterByLetter', 'ShowCreation',
    'FadeIn', 'FadeOut',
    'Transform', 'ReplacementTransform', 'TransformFromCopy', 'ClockwiseTransform',
    'CounterclockwiseTransform', 'MoveToTarget', 'ApplyMethod', 'ApplyFunction',
    'FadeTransform', 'Swap', 'CyclicReplace', 'Restore', 'ScaleInPlace', 'ShrinkToCenter',
    'Shift', 'Rotate', 'GrowFromCenter', 'GrowArrow', 'GrowFromEdge', 'GrowFromPoint',
    'SpinInFromNothing', 'MoveAlongPath',
    'Indicate', 'Flash', 'Circumscribe', 'Wiggle', 'ShowPassingFlash', 'ApplyWave',
    'FocusOn', 'Pulse',
    'AnimationGroup', 'LaggedStart', 'LaggedStartMap', 'Succession',
    'UpdateFromFunc', 'UpdateFromAlphaFunc',
    'Rotating', 'Broadcast',
]);

// Mobject classes (also need `new`)
const MOBJECT_CLASSES = new Set(Object.keys(CLASS_MAP).filter(k => !ANIMATION_CLASSES.has(k)));

// All classes that need `new`
const ALL_CLASSES = new Set([...ANIMATION_CLASSES, ...MOBJECT_CLASSES]);

// ─── Known kwarg renames ─────────────────────────────────────────────
const KWARG_MAP = {
    'run_time': 'duration',
    'rate_func': 'rateFunc',
    'fill_opacity': 'fillOpacity',
    'fill_color': 'fillColor',
    'stroke_width': 'strokeWidth',
    'stroke_color': 'strokeColor',
    'stroke_opacity': 'strokeOpacity',
    'font_size': 'fontSize',
    'font_family': 'fontFamily',
    'font_weight': 'fontWeight',
    'side_length': 'sideLength',
    'arc_center': 'arcCenter',
    'tip_length': 'tipLength',
    'tip_width': 'tipWidth',
    'num_points': 'numPoints',
    'x_range': 'xRange',
    'y_range': 'yRange',
    'z_range': 'zRange',
    'x_length': 'xLength',
    'y_length': 'yLength',
    'z_length': 'zLength',
    'axis_config': 'axisConfig',
    'x_axis_config': 'xAxisConfig',
    'y_axis_config': 'yAxisConfig',
    'include_ticks': 'includeTicks',
    'include_numbers': 'includeNumbers',
    'tick_size': 'tickSize',
    'numbers_to_exclude': 'numbersToExclude',
    'decimal_places': 'decimalPlaces',
    'include_sign': 'includeSign',
    'lag_ratio': 'lagRatio',
    'about_point': 'aboutPoint',
    'about_edge': 'aboutEdge',
    'buff': 'buff',
    'display_mode': 'displayMode',
    'background_line_style': 'backgroundLineStyle',
    'number_scale_value': 'numberScaleValue',
    'include_tip': 'includeTip',
    'line_to_number_buff': 'lineToNumberBuff',
    'bar_width': 'barWidth',
    'bar_separation': 'barSeparation',
    'num_decimal_places': 'decimalPlaces',
    'x_values': 'xValues',
    'y_values': 'yValues',
    'line_color': 'lineColor',
    'add_vertex_dots': 'addVertexDots',
    'vertex_dot_radius': 'vertexDotRadius',
    'vertex_dot_style': 'vertexDotStyle',
    'x_label': 'xLabel',
    'y_label': 'yLabel',
    'z_index': 'zIndex',
    'tex_to_color_map': 'texToColorMap',
    'label_constructor': 'labelConstructor',
};

// ─── Method name remap (snake → camel + special cases) ───────────────
const METHOD_MAP = {
    'set_color': 'setColor',
    'set_fill': 'setFill',
    'set_stroke': 'setStroke',
    'set_opacity': 'setOpacity',
    'set_style': 'setStyle',
    'get_center': 'getCenter',
    'get_top': 'getTop',
    'get_bottom': 'getBottom',
    'get_left': 'getLeft',
    'get_right': 'getRight',
    'get_start': 'getStartPoint',
    'get_end': 'getEndPoint',
    'get_width': 'getWidth',
    'get_height': 'getHeight',
    'move_to': 'moveTo',
    'next_to': 'nextTo',
    'shift': 'shift',
    'scale': 'scale',
    'rotate': 'rotate',
    'flip': 'flip',
    'stretch': 'stretch',
    'to_edge': 'toEdge',
    'to_corner': 'toCorner',
    'align_to': 'alignTo',
    'add_updater': 'addUpdater',
    'remove_updater': 'removeUpdater',
    'become': 'become',
    'copy': 'copy',
    'get_graph': 'getGraph',
    'get_graph_label': 'getGraphLabel',
    'coords_to_point': 'coordsToPoint',
    'point_to_coords': 'pointToCoords',
    'get_origin': 'getOrigin',
    'get_area': 'getArea',
    'get_riemann_rectangles': 'getRiemannRectangles',
    'input_to_graph_point': 'inputToGraphPoint',
    'number_to_point': 'numberToPoint',
    'point_to_number': 'pointToNumber',
    'arrange': 'arrange',
    'arrange_in_grid': 'arrangeInGrid',
    'set_z_index': 'setZIndex',
    'set_value': 'setValue',
    'get_value': 'getValue',
    'wait_for_render': 'waitForRender',
    'generate_target': 'generateTarget',
    'save_state': 'saveState',
    'restore': 'restore',
    'rotate_about_origin': 'rotateAboutOrigin',
    'set_points_as_corners': 'setPointsAsCorners',
    'add_points_as_corners': 'addPointsAsCorners',
    'get_axis_labels': 'getAxisLabels',
    'get_graph_label': 'getGraphLabel',
    'get_vertical_line': 'getVerticalLine',
    'input_to_graph_point': 'inputToGraphPoint',
    'get_riemann_rectangles': 'getRiemannRectangles',
    'get_area': 'getArea',
    'i2gp': 'i2gp',
    'plot': 'plot',
    'plot_line_graph': 'plotLineGraph',
    'c2p': 'coordsToPoint',
};

// ─── Color constant map ──────────────────────────────────────────────
const COLOR_MAP = {
    'WHITE': 'WHITE', 'BLACK': 'BLACK',
    'BLUE': 'BLUE', 'BLUE_A': 'BLUE_A', 'BLUE_B': 'BLUE_B', 'BLUE_C': 'BLUE_C',
    'BLUE_D': 'BLUE_D', 'BLUE_E': 'BLUE_E', 'PURE_BLUE': 'PURE_BLUE',
    'RED': 'RED', 'RED_A': 'RED_A', 'RED_B': 'RED_B', 'RED_C': 'RED_C',
    'RED_D': 'RED_D', 'RED_E': 'RED_E', 'PURE_RED': 'PURE_RED',
    'GREEN': 'GREEN', 'GREEN_A': 'GREEN_A', 'GREEN_B': 'GREEN_B', 'GREEN_C': 'GREEN_C',
    'GREEN_D': 'GREEN_D', 'GREEN_E': 'GREEN_E', 'PURE_GREEN': 'PURE_GREEN',
    'YELLOW': 'YELLOW', 'YELLOW_A': 'YELLOW_A', 'YELLOW_B': 'YELLOW_B', 'YELLOW_C': 'YELLOW_C',
    'YELLOW_D': 'YELLOW_D', 'YELLOW_E': 'YELLOW_E',
    'ORANGE': 'ORANGE', 'PINK': 'PINK',
    'PURPLE': 'PURPLE', 'PURPLE_A': 'PURPLE_A', 'PURPLE_B': 'PURPLE_B', 'PURPLE_C': 'PURPLE_C',
    'PURPLE_D': 'PURPLE_D', 'PURPLE_E': 'PURPLE_E',
    'TEAL': 'TEAL', 'TEAL_A': 'TEAL_A', 'TEAL_B': 'TEAL_B', 'TEAL_C': 'TEAL_C',
    'TEAL_D': 'TEAL_D', 'TEAL_E': 'TEAL_E',
    'GOLD': 'GOLD', 'GOLD_A': 'GOLD_A', 'GOLD_B': 'GOLD_B', 'GOLD_C': 'GOLD_C',
    'GOLD_D': 'GOLD_D', 'GOLD_E': 'GOLD_E',
    'MAROON': 'MAROON', 'MAROON_A': 'MAROON_A', 'MAROON_B': 'MAROON_B', 'MAROON_C': 'MAROON_C',
    'MAROON_D': 'MAROON_D', 'MAROON_E': 'MAROON_E',
    'GRAY': 'GRAY', 'GRAY_A': 'GRAY_A', 'GRAY_B': 'GRAY_B', 'GRAY_C': 'GRAY_C',
    'GRAY_D': 'GRAY_D', 'GRAY_E': 'GRAY_E',
    'GREY': 'GRAY', 'GREY_A': 'GRAY_A', 'GREY_B': 'GRAY_B',
    'LIGHT_GRAY': 'LIGHT_GRAY', 'DARK_GRAY': 'DARK_GRAY',
    'LIGHTER_GREY': 'LIGHTER_GRAY', 'DARKER_GREY': 'DARKER_GRAY',
};

const DIRECTION_MAP = {
    'UP': 'UP', 'DOWN': 'DOWN', 'LEFT': 'LEFT', 'RIGHT': 'RIGHT',
    'ORIGIN': 'ORIGIN', 'OUT': 'OUT', 'IN': 'IN',
    'UL': 'UL', 'UR': 'UR', 'DL': 'DL', 'DR': 'DR',
};

const RATE_FUNC_MAP = {
    'smooth': 'smooth',
    'linear': 'linear',
    'rush_into': 'rushInto',
    'rush_from': 'rushFrom',
    'there_and_back': 'thereAndBack',
    'double_smooth': 'doubleSmooth',
    'ease_in_out': 'easeInOut',
    'ease_in': 'easeIn',
    'ease_out': 'easeOut',
};

// ─── Joins multi-line continuations ───────────────────────────────────
// ─── Joins multi-line continuations (and strips comments) ──────────────
function joinContinuationLines(lines) {
    const result = [];
    let buffer = '';
    let parenDepth = 0;

    for (const line of lines) {
        let inStr = false;
        let strChar = '';
        let commentIdx = -1;

        for (let j = 0; j < line.length; j++) {
            const ch = line[j];
            if (ch === '#' && !inStr) {
                commentIdx = j;
                break;
            }
            if (inStr) {
                if (ch === strChar && line[j - 1] !== '\\') inStr = false;
                continue;
            }
            if (ch === '"' || ch === "'") {
                inStr = true;
                strChar = ch;
                continue;
            }
            if (ch === '(' || ch === '[' || ch === '{') parenDepth++;
            if (ch === ')' || ch === ']' || ch === '}') parenDepth--;
        }

        // Strip comment
        let cleanLine = commentIdx !== -1 ? line.substring(0, commentIdx) : line;

        // Append to buffer
        if (buffer) {
            buffer += ' ' + cleanLine.trim();
        } else {
            // Preserve indentation for the start of the line
            buffer = cleanLine.trimEnd();
        }

        // Check for explicit continuation (backslash)
        // If not inside a string (in matched chars) - though `inStr` resets per line here.
        if (buffer.endsWith('\\')) {
            buffer = buffer.slice(0, -1).trimEnd() + ' ';
            continue;
        }

        // If statement is complete
        if (parenDepth <= 0 && (!buffer.endsWith('\\'))) {
            result.push(buffer);
            buffer = '';
            parenDepth = 0;
        }
    }
    if (buffer) result.push(buffer);
    return result;
}

// ─── Find matching close paren/bracket ───────────────────────────────
function findMatchingParen(s, openIndex) {
    const openCh = s[openIndex];
    const closeCh = openCh === '(' ? ')' : openCh === '[' ? ']' : '}';
    let depth = 0;
    let inStr = false;
    let strChar = '';
    for (let i = openIndex; i < s.length; i++) {
        const ch = s[i];
        if (inStr) {
            if (ch === strChar && s[i - 1] !== '\\') inStr = false;
            continue;
        }
        if (ch === '"' || ch === "'" || ch === '`') { inStr = true; strChar = ch; continue; }
        if (ch === openCh) depth++;
        if (ch === closeCh) {
            depth--;
            if (depth === 0) return i;
        }
    }
    return -1;
}

// ─── Convert np.array([...]) → [...] ─────────────────────────────────
function convertNpArray(line) {
    const pattern = /\bnp\.array\s*\(/g;
    const replacements = [];
    let m;
    while ((m = pattern.exec(line)) !== null) {
        const openParen = m.index + m[0].length - 1;
        const closeParen = findMatchingParen(line, openParen);
        if (closeParen === -1) continue;
        const inner = line.slice(openParen + 1, closeParen).trim();
        replacements.push({ start: m.index, end: closeParen + 1, inner });
    }
    for (let i = replacements.length - 1; i >= 0; i--) {
        const r = replacements[i];
        line = line.slice(0, r.start) + r.inner + line.slice(r.end);
    }
    return line;
}

// ─── Convert nested function definitions to arrow functions ──────────
function convertNestedDefs(lines) {
    const result = [];
    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        const defMatch = line.match(/^(\s*)def\s+(\w+)\s*\(([^)]*)\)\s*:/);
        if (defMatch) {
            const [, indent, funcName, params] = defMatch;
            const tsParams = params.split(',').map(p => p.trim()).filter(p => p && p !== 'self').join(', ');
            result.push(`${indent}${funcName} = (${tsParams}) => {`);

            const defIndent = indent.length;
            i++;
            while (i < lines.length) {
                const bodyLine = lines[i];
                if (bodyLine.trim() === '') {
                    result.push('');
                    i++;
                    continue;
                }
                const bodyIndent = bodyLine.match(/^(\s*)/)[1].length;
                if (bodyIndent <= defIndent) break;
                result.push(bodyLine);
                i++;
            }
            result.push(`${indent}};`);
        } else {
            result.push(line);
            i++;
        }
    }
    return result;
}

// ─── Add closing braces based on indentation ──────────────────────────
function addBlockBraces(lines) {
    const result = [];
    const stack = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.trim() === '') {
            result.push(line);
            continue;
        }

        const indentMatch = line.match(/^(\s*)/);
        const indent = indentMatch ? indentMatch[1].length : 0;

        // 1. Handle Dedent (Close Blocks)
        while (stack.length > 0) {
            const top = stack[stack.length - 1];
            if (indent <= top.outerIndent) {
                stack.pop();
                // If popping multiple levels, we MUST close the inner block with a new brace.
                // If we are at the exact same indent, we only insert if the line itself doesn't provide the brace.
                if (top.outerIndent > indent) {
                    result.push(' '.repeat(top.outerIndent) + '}');
                } else if (top.outerIndent === indent) {
                    if (!line.trim().startsWith('}')) {
                        result.push(' '.repeat(top.outerIndent) + '}');
                    }
                }
            } else {
                break;
            }
        }

        result.push(line);

        // 2. Handle Indent (Open Block)
        // convertLine adds `{` for if/for/while etc.
        if (line.trim().endsWith('{') && !line.trim().startsWith('//')) {
            stack.push({ outerIndent: indent });
        }
    }

    // Close any remaining open blocks
    while (stack.length > 0) {
        const top = stack.pop();
        result.push(' '.repeat(top.outerIndent) + '}');
    }

    return result;
}

// ─── Main converter ──────────────────────────────────────────────────
function convertPythonToTypeScript(pythonCode) {
    if (!pythonCode) return '';

    const rawLines = pythonCode.split('\n');
    const lines = joinContinuationLines(rawLines);

    // ── Phase 1: Parse into scene blocks ──
    const scenes = [];
    let currentScene = null;
    let inConstruct = false;
    let baseIndent = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (/^\s*(from\s+manim|import\s+manim|import\s+numpy|from\s+numpy)/.test(line)) continue;
        if (/^\s*import\s+/.test(line) && !line.includes('=')) continue;
        if (/^\s*if\s+__name__/.test(line)) { inConstruct = false; continue; }

        const classMatch = line.match(/^class\s+(\w+)\s*\(\s*(\w+)\s*\)\s*:/);
        if (classMatch) {
            currentScene = { name: classMatch[1], base: classMatch[2], lines: [] };
            scenes.push(currentScene);
            inConstruct = false;
            continue;
        }

        const constructMatch = line.match(/^(\s*)def\s+construct\s*\(\s*self\s*\)\s*:/);
        if (constructMatch && currentScene) {
            inConstruct = true;
            baseIndent = constructMatch[1].length + 4;
            continue;
        }

        if (/^\s*def\s+\w+\s*\(/.test(line) && !/def\s+construct/.test(line)) {
            const defIndent = line.match(/^(\s*)/)[1].length;
            if (defIndent < baseIndent) {
                inConstruct = false;
                continue;
            }
        }

        if (!currentScene || !inConstruct) continue;

        if (line.length > 0 && !/^\s*$/.test(line)) {
            const currentIndent = line.match(/^(\s*)/)[1].length;
            if (currentIndent < baseIndent && currentIndent > 0 && !/^\s*#/.test(line)) {
                inConstruct = false;
                continue;
            }
        }

        if (/^\s*$/.test(line)) {
            currentScene.lines.push('');
        } else {
            const ci = line.match(/^(\s*)/)[1].length;
            currentScene.lines.push(ci >= baseIndent ? '  ' + line.slice(baseIndent) : line);
        }
    }

    if (scenes.length === 0) {
        scenes.push({ name: 'MyScene', base: 'Scene', lines: lines.map(l => '  ' + l) });
    }

    // ── Phase 2: Convert each scene ──
    const tracking = {
        usedClasses: new Set(['Scene']),
        usedColors: new Set(),
        usedDirections: new Set(),
        usedRateFuncs: new Set(),
        usedUtilities: new Set(),
    };

    const convertedScenes = scenes.map(scene => {
        scene.lines = convertNestedDefs(scene.lines);
        const varRenames = new Map();
        const mathTexVars = new Set();
        const converted = [];
        for (const line of scene.lines) {
            converted.push(convertLine(line, tracking, varRenames, mathTexVars));
        }

        // Add closing braces for blocks
        const finalLines = addBlockBraces(converted);

        let funcName = scene.name.replace(/Scene$/, '');
        if (!funcName) funcName = scene.name;
        funcName = funcName[0].toLowerCase() + funcName.slice(1);
        return { name: scene.name, funcName, lines: finalLines };
    });

    // ── Phase 3: Build output (No imports - just the function body) ──
    // We return just the function body because frontend ManimVisualizer expects that generally.
    // OR we can return the whole module with exports if we want to run it that way.
    // The original Py2TS outputs a full TS file with imports.
    // For ManimVisualizer, we usually wrap the code in a function.
    // Let's output the full module code, but adapted for frontend execution likely inside an eval or function sandbox.

    const output = [];

    // Imports are implicit in ManimVisualizer context generally, but if we want valid JS module:
    // output.push('// Manim Imports handled by ManimVisualizer context');

    for (const scene of convertedScenes) {
        // We name the function same as scene but camelCased
        output.push(`async function ${scene.funcName}(scene) {`);
        let lastBlank = false;
        for (const line of scene.lines) {
            // Simple indent fix
            if (line.trim() === '') {
                if (lastBlank) continue;
                lastBlank = true;
            } else {
                lastBlank = false;
            }
            output.push(line);
        }
        output.push('}');
        output.push('');
        // Also attach it to window or return it if needed?
        // ManimVisualizer usually expects `async function runScene(scene) { ... }`
        // Let's rename the FIRST scene function to runScene to match ManimVisualizer expectations
        // Or just export it.
    }

    // If we have multiple scenes, we might need to handle that. Usually there's one main scene.
    // Let's just return the joined code.
    if (convertedScenes.length > 0) {
        // Add a small helper to auto-run the last scene or specific scene match
        // But ManimVisualizer expects the user to provide a `run` function or similar.
        // Default ManimVisualizer prompt expects: `export default async (scene) => { ... }` or similar.
        // Let's stick as close to the ManimVisualizer expectation as possible.
        // The ManimVisualizer usually runs whatever function is passed to it.

        // We will wrap the first scene logic into what ManimVisualizer expects:
        // An async function taking (scene).

        // We return ONLY the function body of the first scene, wrapped correctly.
        // Actually, ManimVisualizer eval logic:
        // try {
        //   const runScene = new Function('scene', ...);
        //   await runScene(scene);
        // }
        // Checks lines 645 in ManimVisualizer.jsx

        // Wait, ManimVisualizer.jsx lines 645:
        // const runScene = async (scene) => { ... eval(code) ... }
        // It evals the CODE string directly.
        // If the code string defines functions, they are defined in that scope.
        // We need to ensuring we call the main function.

        // Let's just return the code as is. The user code in ManimVisualizer often looks like:
        // "const square = new Square(); scene.add(square);"
        // OR function definitions.

        // If we output `async function squareToCircle(scene) { ... }`, we need to CALL it.
        // So at the end of the output, we should add:
        // `await ${convertedScenes[0].funcName}(scene);`

        const mainScene = convertedScenes[0];
        output.push(`// Auto-generated execution for ${mainScene.funcName}`);
        output.push(`await ${mainScene.funcName}(scene);`);
    }

    return output.join('\n');
}

// ─── Convert a single line of Python → TypeScript ────────────────────
function convertLine(rawLine, tracking, varRenames, mathTexVars = new Set()) {
    if (rawLine.trim() === '') return rawLine;
    let line = rawLine;

    // line = line.replace(/#(.*)$/, '//$1'); // REMOVED: Comments are stripped in joinContinuationLines now.
    line = line.replace(/\bTrue\b/g, 'true');
    line = line.replace(/\bFalse\b/g, 'false');
    line = line.replace(/\bNone\b/g, 'null');

    line = line.replace(/self\.play\s*\(/g, 'await scene.play(');
    line = line.replace(/self\.wait\s*\(/g, 'await scene.wait(');
    line = line.replace(/self\.add\s*\(/g, 'scene.add(');
    line = line.replace(/self\.remove\s*\(/g, 'scene.remove(');
    line = line.replace(/self\.clear\s*\(/g, 'scene.clear(');
    line = line.replace(/self\.camera/g, 'scene.camera');

    line = line.replace(
        /await scene\.play\(\s*scene\.camera\.frame\.animate\.scale\s*\(([^)]+)\)\.(?:move_to|moveTo)\s*\(([^)]+)\)\s*\)/g,
        (_, scaleFactor, target) => {
            tracking.usedClasses.add('MoveToTarget');
            const sf = scaleFactor.trim();
            const tgt = target.trim();
            return [
                'scene.camera.frame.generateTarget()',
                `  scene.camera.frame.targetCopy.scale(${sf})`,
                `  scene.camera.frame.targetCopy.moveTo(${tgt}.getCenter())`,
                `  await scene.play(new MoveToTarget(scene.camera.frame))`
            ].join(';\n');
        }
    );

    /* REMOVED generic animation replacements to use JS-side Mobject.animate polyfill (which uses MoveToTarget)
    line = line.replace(/(\w+)\.animate\.shift\s*\(([^)]+)\)/g, (_, obj, args) => {
        tracking.usedClasses.add('Shift');
        return `new Shift(${obj}, { direction: ${args.trim()} })`;
    });
    line = line.replace(/(\w+)\.animate\.scale\s*\(([^)]+)\)/g, (_, obj, args) => {
        tracking.usedClasses.add('Scale');
        return `new Scale(${obj}, { factor: ${args.trim()} })`;
    });
    line = line.replace(/(\w+)\.animate\.rotate\s*\(([^)]+)\)/g, (_, obj, args) => {
        tracking.usedClasses.add('Rotate');
        return `new Rotate(${obj}, { angle: ${args.trim()} })`;
    });
    line = line.replace(/(\w+)\.animate\.(?:set_color|setColor)\s*\(([^)]+)\)/g, (_, obj, args) => {
        tracking.usedClasses.add('FadeToColor');
        return `new FadeToColor(${obj}, { color: ${args.trim()} })`;
    });
    */
    line = line.replace(/(\w+)\.animate\.(?:set_value|setValue)\s*\(([^)]+)\)/g, '$1.animateTo($2)');

    // Polyfill camera manipulations (often hallucinated by AI)
    // self.camera.frame.set_width(w) -> scene.autoZoom()
    line = line.replace(/self\.camera\.frame\.(?:set_width|set_height|scale|move_to)\s*\(([^)]+)\)/g, 'scene.autoZoom()');

    line = line.replace(/self\./g, '');



    // Python unpacking `**kwargs` -> JS `...kwargs`
    // We MUST distinguish this from `x ** 2` (exponentiation).
    // Unpacking is usually `func(..., **kwargs)` or `{**d}`.
    // It is preceded by `(`, `,`, `{` or whitespace, but NOT by `)`, `]`, `}` or `\w` (which imply math).
    // Also, unpacking variable MUST be a valid identifier (starts with letter/_), not a number.

    // 1. Remove naive Math.pow conversion (JS supports ** natively)
    // line = line.replace(/(\w+)\s*\*\*\s*(\w+)/g, 'Math.pow($1, $2)');

    // Fix JS SyntaxError: -x**2 -> -(x**2) (Unary operator cannot be used immediately before exponentiation)
    // Matches: (start/non-word) - base ** exp
    // Handles simple bases/exponents (vars, nums, dots).
    line = line.replace(/(^|[^a-zA-Z0-9_])-\s*([a-zA-Z0-9_.]+)\s*\*\*\s*([a-zA-Z0-9_.]+)/g, '$1-($2**$3)');

    // 2. Convert unpacking
    // Lookbehind for safe predecessors: starts with line, or follows , ( { [
    // AND followed by a variable (not number)
    line = line.replace(/(^|(?<=[,({[]))\s*\*\*\s*([a-zA-Z_]\w*)/g, '$1...$2');

    // 3. Convert list unpacking `*args` -> `...args`
    // Similar logic: matches * if preceded by safe char and followed by var
    line = line.replace(/(^|(?<=[,({[]))\s*\*(?!\*)\s*([a-zA-Z_]\w*)/g, '$1...$2');
    line = line.replace(/(?<![a-zA-Z0-9_])\*(?!\*)\[/g, '...['); // *[list] -> ...[list]

    // 4. Convert lambda functions using manual parsing to handle nested parens
    // Regex is too weak for `getGraph(lambda x: func(x))`
    line = convertLambdas(line);

    // Python integer division `//` -> `Math.floor(... / ...)`
    // Comments are already converted from # -> // above.
    // We match `expr // expr` where `//` is preceded by word char or ) or ]
    // Use a function to find the full operands
    line = line.replace(/(\b[a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*)*(?:\([^)]*\))?|\d+(?:\.\d+)?)\s*\/\/\s*(\b[a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*)*(?:\([^)]*\))?|\d+(?:\.\d+)?)/g, 'Math.floor($1 / $2)');

    line = line.replace(/\bmath\.pi\b/gi, 'Math.PI');
    // Only convert standalone PI that is NOT already preceded by `Math.`
    line = line.replace(/(?<!Math\.)\bPI\b/g, 'Math.PI');
    line = line.replace(/\bTAU\b/g, '2 * Math.PI');
    line = line.replace(/\bDEGREES\b/g, '(Math.PI / 180)');
    line = line.replace(/\bmath\.(sqrt|sin|cos|tan|exp|log|abs|ceil|floor)\b/g, 'Math.$1');
    line = line.replace(/\bnp\.(sin|cos|sqrt|tan|exp|log)\b/g, 'Math.$1');
    // Fix any accidental double Math.Math from chained replacements
    line = line.replace(/\bMath\.Math\./g, 'Math.');
    line = convertNpArray(line);
    line = line.replace(/\bnp\.pi\b/g, 'Math.PI');

    line = line.replace(/\bnp\.arange\s*\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)/g,
        (_, start, stop, step) => {
            const arr = [];
            const s = parseFloat(start), e = parseFloat(stop), st = parseFloat(step);
            for (let i = s; i < e; i += st) {
                arr.push(Math.round(i * 1e10) / 1e10);
            }
            return `[${arr.join(', ')}]`;
        }
    );

    line = line.replace(/\bnp\.linspace\s*\(/g, () => {
        tracking.usedUtilities.add('linspace');
        return 'linspace(';
    });
    // Also handle Math.linspace (from math.linspace being converted)
    line = line.replace(/\bMath\.linspace\s*\(/g, () => {
        tracking.usedUtilities.add('linspace');
        return 'linspace(';
    });

    line = line.replace(/(\w+(?:\.\w+)*)\s*\[\s*:(\d+)\s*\]/g, '$1.slice(0, $2)');
    line = line.replace(/(\w+(?:\.\w+)*)\s*\[(\d+)\s*:\s*\]/g, '$1.slice($2)');

    line = line.replace(/(\w+)\((\w+)\)\.argmin\(\)/g,
        '$2.reduce((mi, _, i, a) => $1(a[i]) < $1(a[mi]) ? i : mi, 0)');

    // line = line.replace(/(\w+)\s*\*\*\s*(\w+)/g, 'Math.pow($1, $2)');

    line = line.replace(/range\((\d+)\)/g, 'Array.from({length: $1}, (_, i) => i)');
    line = line.replace(/range\((\d+),\s*(\d+)\)/g,
        'Array.from({length: $2 - $1}, (_, i) => i + $1)');

    // Python list comprehension: [expr for var in iterable] -> iterable.map((var) => expr)
    // We need to match the brackets [ ... ] to ensure we only replace the comprehension itself.
    // However, if the iterable is a literal array like [-0.5, 0, 0.5], we need to wrap it in parens to call .map
    // We use a non-greedy match for the expr and iterable, and check if it ends with exactly ].
    line = line.replace(
        /\[\s*(.+?)\s+for\s+(\w+)\s+in\s+([^\]]+?)\s*\]/g,
        '($3).map(($2) => $1)'
    );

    // Helper for f-string conversion (handles double braces {{ }} and raw strings)
    function processFStringContent(content, isRaw) {
        // 1. Double Backslashes for raw strings (since JS template literals treat \ as escape)
        if (isRaw) {
            content = content.replace(/\\/g, '\\\\');
        }

        // 2. Double brace protection: {{ -> ESC_OPEN, }} -> ESC_CLOSE
        // Use private use characters to avoid collision
        const ESC_OPEN = '\uE000';
        const ESC_CLOSE = '\uE001';
        content = content.replace(/\{\{/g, ESC_OPEN).replace(/\}\}/g, ESC_CLOSE);

        // 3. Interpolate {expr} -> ${expr} using balanced brace matching
        let result = '';
        let i = 0;
        while (i < content.length) {
            if (content[i] === '{') {
                const close = findMatchingParen(content, i);
                if (close !== -1) {
                    const expr = content.slice(i + 1, close);
                    result += '${' + expr + '}';
                    i = close + 1;
                } else {
                    // Unmatched { treated as literal
                    result += '{';
                    i++;
                }
            } else {
                result += content[i];
                i++;
            }
        }

        // 4. Restore double braces: ESC_OPEN -> {, ESC_CLOSE -> }
        return result.replace(new RegExp(ESC_OPEN, 'g'), '{')
            .replace(new RegExp(ESC_CLOSE, 'g'), '}');
    }

    // Convert f-strings (f"...", f'...', rf"...", fr"...", etc.)
    // Supports raw strings (fr/rf) by escaping backslashes.
    line = line.replace(/(fr|rf|f)(["'])(.*?)\2/g, (_, prefix, quote, inner) => {
        const isRaw = prefix.includes('r');
        const processed = processFStringContent(inner, isRaw);
        return '`' + processed + '`';
    });

    line = line.replace(/(?<![a-zA-Z0-9_"])r"([^"]*?)"/g, (_, s) => '"' + s.replace(/\\/g, '\\\\') + '"');
    line = line.replace(/(?<![a-zA-Z0-9_'])r'([^']*?)'/g, (_, s) => "'" + s.replace(/\\/g, '\\\\') + "'");

    line = line.replace(/\bUP\s*\+\s*LEFT\b/g, 'UL');
    line = line.replace(/\bUP\s*\+\s*RIGHT\b/g, 'UR');
    line = line.replace(/\bDOWN\s*\+\s*LEFT\b/g, 'DL');
    line = line.replace(/\bDOWN\s*\+\s*RIGHT\b/g, 'DR');
    line = line.replace(/\bLEFT\s*\+\s*UP\b/g, 'UL');
    line = line.replace(/\bRIGHT\s*\+\s*UP\b/g, 'UR');
    line = line.replace(/\bLEFT\s*\+\s*DOWN\b/g, 'DL');
    line = line.replace(/\bRIGHT\s*\+\s*DOWN\b/g, 'DR');

    const dirNames = Object.keys(DIRECTION_MAP).join('|');
    const dirRe = `\\b(${dirNames})\\b`;
    line = line.replace(new RegExp(`${dirRe}\\s*/\\s*(\\d+(?:\\.\\d+)?)`, 'g'), (_, dir, num) => {
        tracking.usedDirections.add(dir);
        tracking.usedUtilities.add('scaleVec');
        return `scaleVec(${1 / parseFloat(num)}, ${dir})`;
    });
    line = line.replace(new RegExp(`${dirRe}\\s*\\*\\s*(\\d+(?:\\.\\d+)?)`, 'g'), (_, dir, num) => {
        tracking.usedDirections.add(dir);
        tracking.usedUtilities.add('scaleVec');
        return `scaleVec(${num}, ${dir})`;
    });
    line = line.replace(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*\\*\\s*${dirRe}`, 'g'), (_, num, dir) => {
        tracking.usedDirections.add(dir);
        tracking.usedUtilities.add('scaleVec');
        return `scaleVec(${num}, ${dir})`;
    });

    // --- Vector Arithmetic (Add/Sub) ---
    // Handle: A + B -> addVectors(A, B) using iterative replacement for chaining
    // Matches known vector types: scaleVec(...), addVectors(...), np.array(...), [literal], obj.getCenter(), CONSTANT
    const nParen = `(?:[^()]*|\\([^()]*\\))*`;
    const knownValues = [
        `scaleVec\\(${nParen}\\)`,       // scaleVec(...)
        `addVectors\\(${nParen}\\)`,     // addVectors(...)
        `subVectors\\(${nParen}\\)`,     // subVectors(...)
        `np\\.array\\(${nParen}\\)`,     // np.array(...)
        `\\[[\\d.,\\s\\-]+\\]`,      // [1, 2, 3] literals
        `\\w+(?:\\.\\w+)*\\.getCenter\\(\\)`,    // obj.getCenter()
        `\\w+(?:\\.\\w+)*\\.get_center\\(\\)`,   // obj.get_center()
        `ORIGIN`,
        ...Object.keys(DIRECTION_MAP) // UP, DOWN, etc.
    ];
    const vecPattern = `(?:${knownValues.join('|')})`;

    // Iteratively replace (Vector) + (Vector) until no more matches
    // This allows A + B + C -> addVectors(A, B) + C -> addVectors(addVectors(A, B), C)
    const vecAddRe = new RegExp(`(${vecPattern})\\s*(\\+|\\-)\\s*(${vecPattern})`);

    let loopCount = 0;
    while (vecAddRe.test(line) && loopCount < 10) {
        line = line.replace(vecAddRe, (_, v1, op, v2) => {
            const func = op === '+' ? 'addVectors' : 'subtractVectors';
            tracking.usedUtilities.add(func);
            return `${func}(${v1}, ${v2})`;
        });
        loopCount++;
    }

    for (const c of Object.keys(COLOR_MAP)) {
        if (new RegExp(`\\b${c}\\b`).test(line)) tracking.usedColors.add(c);
    }
    for (const d of Object.keys(DIRECTION_MAP)) {
        if (new RegExp(`\\b${d}\\b`).test(line)) tracking.usedDirections.add(d);
    }

    for (const [pyName, tsName] of Object.entries(RATE_FUNC_MAP)) {
        if (line.includes(pyName)) {
            line = line.replace(new RegExp(`\\b${pyName}\\b`, 'g'), tsName);
            tracking.usedRateFuncs.add(tsName);
        }
    }

    for (const [pyKey, tsKey] of Object.entries(KWARG_MAP)) {
        line = line.replace(new RegExp(`(?<=[,(])\\s*\\b${pyKey}\\s*=(?!=)\\s*`, 'g'), (m) => {
            const ws = m.match(/^(\s*)/)[1];
            return `${ws}${tsKey}: `;
        });
    }

    line = line.replace(/(?<=[,(])\s*\b([a-z_][a-z_0-9]*)=(?!=)\s*/g, (match, key) => {
        const ws = match.match(/^(\s*)/)[1];
        return `${ws}${KWARG_MAP[key] || snakeToCamel(key)}: `;
    });

    line = line.replace(/"([a-z_][a-z_0-9]*)"\s*:/g, (_, key) =>
        `${KWARG_MAP[key] || snakeToCamel(key)}:`);

    for (const [pyMethod, tsMethod] of Object.entries(METHOD_MAP)) {
        line = line.replace(new RegExp(`\\.${pyMethod}\\b`, 'g'), `.${tsMethod}`);
    }

    line = line.replace(/\.([a-z_][a-z_0-9]*)\s*\(/g, (_, method) =>
        `.${snakeToCamel(method)}(`);

    line = line.replace(/\.([a-z_][a-z_0-9]*)(?=\s*[.[,);\s]|$)(?!\s*\()/g, (_, prop) =>
        `.${snakeToCamel(prop)}`);

    for (const cls of Object.keys(CLASS_MAP)) {
        const tsClass = CLASS_MAP[cls];
        const re = new RegExp(`(?<!\\.|new\\s)\\b${cls}\\s*\\(`, 'g');
        if (re.test(line)) {
            tracking.usedClasses.add(tsClass);
            line = line.replace(new RegExp(`(?<!\\.|new\\s)\\b${cls}\\s*\\(`, 'g'), `new ${tsClass}(`);
        }
        const valueRe = new RegExp(`:\\s*${tsClass}\\b(?!\\s*[({])`, 'g');
        if (valueRe.test(line)) {
            tracking.usedClasses.add(tsClass);
        }
    }

    line = line.replace(/([=:])\s*\(([^()]*,[^()]*)\)/g, (match, sep, inner, offset) => {
        if (sep === '=' && offset > 0 && /[=!<>]/.test(line[offset - 1])) return match;
        const afterClose = line.slice(offset + match.length);
        if (/^\s*=>/.test(afterClose)) return match;
        return `${sep} [${inner}]`;
    });

    line = convertConstructorArgs(line);
    line = convertMethodCallArgs(line);
    line = line.replace(/\bGREY\b/g, 'GRAY');

    line = line.replace(/\.upper\(\)/g, '.toUpperCase()');
    line = line.replace(/\.lower\(\)/g, '.toLowerCase()');
    line = line.replace(/\.strip\(\)/g, '.trim()');
    line = line.replace(/\.append\(/g, '.push(');
    line = line.replace(/\.extend\(([^)]+)\)/g, '.push(...$1)');
    line = line.replace(/\blen\((\w+)\)/g, '$1.length');

    if (/^\s*(if|elif|else|for|while|try|except|finally|with)\b/.test(rawLine)) {
        line = line.replace(/:\s*$/, ' {');
    }

    line = line.replace(/\belif\b/g, 'else if');

    line = line.replace(
        /for\s+(\w+)\s+in\s+Array\.from\(\{length:\s*(\w+)\},\s*\(_, i\) => i\)/g,
        'for (let $1 = 0; $1 < $2; $1++)'
    );
    // `for i, x in enumerate(y):` -> `for (const [i, x] of y.entries()) {`
    line = line.replace(/for\s+(\w+)\s*,\s*(\w+)\s+in\s+enumerate\((.+?)\)\s*\{\s*$/g,
        'for (const [$1, $2] of Array.from($3.entries ? $3.entries() : $3.map((v, i) => [i, v]))) {');
    // `for i, x in y:` (without enumerate) -> `for (const [i, x] of y.entries()) {`
    line = line.replace(/for\s+(\w+)\s*,\s*(\w+)\s+in\s+(.+?)\s*\{\s*$/g,
        'for (const [$1, $2] of $3) {');
    line = line.replace(/for\s+(\w+)\s+in\s+(.+?)\s*\{\s*$/g, 'for (const $1 of $2) {');

    line = line.replace(/^(\s*)(if|else if)\s+(.+?)\s*\{/g, '$1$2 ($3) {');
    line = line.replace(/^(\s*)while\s+(.+?)\s*\{/g, '$1while ($2) {');

    // Tuple unpacking: `a, b = x, y` -> `const [a, b] = [x, y]`
    const tupleMatch = line.match(/^(\s*)([a-zA-Z_]\w*)\s*,\s*([a-zA-Z_]\w*)\s*=\s*(.+)/);
    if (tupleMatch && !/\b(const|let|var)\s/.test(line) && !/^\s*for\b/.test(line.trim())) {
        const [, indent, var1, var2, rhs] = tupleMatch;
        const camel1 = snakeToCamel(var1);
        const camel2 = snakeToCamel(var2);
        varRenames.set(var1, camel1);
        varRenames.set(var2, camel2);
        // If RHS has a comma, destructure both sides
        const rhsParts = rhs.split(',').map(s => s.trim());
        if (rhsParts.length >= 2) {
            line = `${indent}const [${camel1}, ${camel2}] = [${rhsParts.join(', ')}]`;
        } else {
            line = `${indent}const [${camel1}, ${camel2}] = ${rhs}`;
        }
    }

    const varMatch = line.match(/^(\s*)([a-zA-Z_]\w*)\s*=\s*(.+)/);
    let isMathTexAssignment = false;
    let assignedVarName = null;
    let assignIndent = '';
    if (varMatch) {
        const [, indent, varName, value] = varMatch;
        if (!/\b(const|let|var)\s/.test(line) &&
            !/^\s*(for|if|while|return|export)\b/.test(line.trim()) &&
            !varRenames.has(varName)) {
            const camelName = snakeToCamel(varName);
            varRenames.set(varName, camelName);
            line = `${indent}const ${camelName} = ${value}`;
            assignIndent = indent;
            assignedVarName = camelName;

            if (/\bnew\s+MathTex\b/.test(value) || /\bnew\s+Tex\b/.test(value)) {
                mathTexVars.add(camelName);
                isMathTexAssignment = true;
            }
        }
    }

    for (const mtVar of mathTexVars) {
        line = line.replace(new RegExp(`\\b${mtVar}\\[\\s*(\\d+)\\s*\\]`, 'g'), `${mtVar}.getPart($1)`);
    }

    for (const [original, camel] of varRenames) {
        if (original !== camel) {
            line = line.replace(new RegExp(`\\b${original}\\b`, 'g'), camel);
        }
    }

    if (shouldAddSemicolon(line)) {
        line = line.replace(/\s*$/, ';');
    }

    if (isMathTexAssignment && assignedVarName) {
        line += `\n${assignIndent}await ${assignedVarName}.waitForRender();`;
    }

    return line;
}

// ─── Convert constructor args to options object ──────────────────────
function convertConstructorArgs(line) {
    const regex = /new\s+(\w+)\s*\(/g;
    const matches = [];
    let m;
    while ((m = regex.exec(line)) !== null) {
        matches.push({ index: m.index, className: m[1], parenIndex: m.index + m[0].length - 1 });
    }

    for (let i = matches.length - 1; i >= 0; i--) {
        const { className, parenIndex } = matches[i];
        const closeIndex = findMatchingParen(line, parenIndex);
        if (closeIndex === -1) continue;

        const args = line.slice(parenIndex + 1, closeIndex);
        if (!args.trim()) continue;
        if (args.trim().startsWith('{')) continue;

        const needsWrapping = ['Text', 'Title', 'Paragraph', 'MarkupText', 'MathTex', 'Tex'].includes(className);
        const needsDotWrapping = ['Dot', 'SmallDot', 'LargeDot'].includes(className);
        const needsPositionalWrapping = ['Line', 'Arrow', 'DoubleArrow', 'Line3D', 'Arrow3D', 'Vector'].includes(className);
        if (!args.includes(':') && !needsWrapping && !needsPositionalWrapping && !needsDotWrapping) continue;

        const parts = smartSplit(args);
        const positional = [];
        const kwargs = [];

        for (const part of parts) {
            if (/^\s*\w+\s*:/.test(part) && !part.trim().startsWith('"') && !part.trim().startsWith("'") && !part.trim().startsWith('`')) {
                kwargs.push(part.trim());
            } else {
                positional.push(part.trim());
            }
        }

        if (kwargs.length === 0 && !needsWrapping && !needsPositionalWrapping && !needsDotWrapping) continue;

        let newArgs;

        if (needsDotWrapping) {
            if (positional.length > 0) {
                const kw = kwargs.length > 0 ? ', ' + kwargs.join(', ') : '';
                newArgs = `{ point: ${positional[0]}${kw} }`;
            } else if (kwargs.length > 0) {
                newArgs = `{ ${kwargs.join(', ')} }`;
            } else {
                continue;
            }
        } else if (className === 'MoveAlongPath') {
            if (positional.length >= 2) {
                const opts = [{ key: 'path', val: positional[1] }];
                for (const k of kwargs) opts.push({ key: null, val: k });
                newArgs = `${positional[0]}, { ${opts.map(o => o.key ? `${o.key}: ${o.val}` : o.val).join(', ')} }`;
            } else if (positional.length === 1 && kwargs.length > 0) {
                newArgs = `${positional[0]}, { ${kwargs.join(', ')} }`;
            } else {
                continue;
            }
        } else if (className === 'Text' || className === 'Title' || className === 'Paragraph' || className === 'MarkupText') {
            if (positional.length > 0) {
                const kw = kwargs.length > 0 ? ', ' + kwargs.join(', ') : '';
                newArgs = `{ text: ${positional[0]}${kw} }`;
            } else {
                newArgs = `{ ${kwargs.join(', ')} }`;
            }
        } else if (className === 'MathTex' || className === 'Tex') {
            if (positional.length > 1) {
                const latexArray = `[${positional.join(', ')}]`;
                const kw = kwargs.length > 0 ? ', ' + kwargs.join(', ') : '';
                newArgs = `{ latex: ${latexArray}${kw} }`;
            } else if (positional.length > 0) {
                const kw = kwargs.length > 0 ? ', ' + kwargs.join(', ') : '';
                newArgs = `{ latex: ${positional[0]}${kw} }`;
            } else {
                newArgs = `{ ${kwargs.join(', ')} }`;
            }
        } else if (className === 'Line' || className === 'Arrow' || className === 'DoubleArrow' ||
            className === 'Line3D' || className === 'Arrow3D') {
            if (positional.length >= 2) {
                newArgs = `{ start: ${positional[0]}, end: ${positional[1]}`;
                if (kwargs.length > 0) newArgs += ', ' + kwargs.join(', ');
                newArgs += ' }';
            } else if (positional.length === 1) {
                newArgs = `{ start: ORIGIN, end: ${positional[0]}`;
                if (kwargs.length > 0) newArgs += ', ' + kwargs.join(', ');
                newArgs += ' }';
            } else {
                newArgs = `{ ${kwargs.join(', ')} }`;
            }
        } else if (['Transform', 'ReplacementTransform', 'TransformFromCopy',
            'ClockwiseTransform', 'CounterclockwiseTransform'].includes(className)) {
            if (positional.length >= 2) {
                const opts = kwargs.length > 0 ? `, { ${kwargs.join(', ')} }` : '';
                newArgs = `${positional[0]}, ${positional[1]}${opts}`;
            } else {
                continue;
            }
        } else if (ANIMATION_CLASSES.has(className)) {
            if (positional.length > 0) {
                const opts = kwargs.length > 0 ? `, { ${kwargs.join(', ')} }` : '';
                newArgs = `${positional.join(', ')}${opts}`;
            } else {
                continue;
            }
        } else {
            if (positional.length > 0) {
                newArgs = `${positional.join(', ')}, { ${kwargs.join(', ')} }`;
            } else {
                newArgs = `{ ${kwargs.join(', ')} }`;
            }
        }

        line = line.slice(0, parenIndex + 1) + newArgs + line.slice(closeIndex);
    }

    return line;
}

// ─── Convert method call kwargs to options object ────────────────────
function convertMethodCallArgs(line) {
    const regex = /\.(\w+)\s*\(/g;
    const matches = [];
    let m;
    while ((m = regex.exec(line)) !== null) {
        const parenIndex = line.indexOf('(', m.index + m[1].length);
        if (parenIndex === -1) continue;
        matches.push({ method: m[1], parenIndex });
    }

    for (let i = matches.length - 1; i >= 0; i--) {
        const { parenIndex } = matches[i];
        const closeIndex = findMatchingParen(line, parenIndex);
        if (closeIndex === -1) continue;

        const args = line.slice(parenIndex + 1, closeIndex);
        if (!args.trim()) continue;
        if (!args.includes(':')) continue;
        if (args.trim().startsWith('{')) continue;

        const parts = smartSplit(args);
        const positional = [];
        const kwargs = [];

        for (const part of parts) {
            if (/^\s*\w+\s*:/.test(part) && !part.trim().startsWith('"') && !part.trim().startsWith("'") && !part.trim().startsWith('`')) {
                kwargs.push(part.trim());
            } else {
                positional.push(part.trim());
            }
        }

        if (kwargs.length === 0) continue;

        const posStr = positional.length > 0 ? positional.join(', ') + ', ' : '';
        const newArgs = `${posStr}{ ${kwargs.join(', ')} }`;
        line = line.slice(0, parenIndex + 1) + newArgs + line.slice(closeIndex);
    }

    return line;
}

// ─── Smart split by commas (respects nesting) ────────────────────────
function smartSplit(s) {
    const parts = [];
    let depth = 0;
    let current = '';
    let inStr = false;
    let strChar = '';

    for (let i = 0; i < s.length; i++) {
        const ch = s[i];

        if (inStr) {
            current += ch;
            if (ch === strChar && s[i - 1] !== '\\') inStr = false;
            continue;
        }

        if (ch === '"' || ch === "'" || ch === '`') {
            inStr = true;
            strChar = ch;
            current += ch;
            continue;
        }

        if (ch === '(' || ch === '[' || ch === '{') { depth++; current += ch; continue; }
        if (ch === ')' || ch === ']' || ch === '}') { depth--; current += ch; continue; }

        if (ch === ',' && depth === 0) {
            parts.push(current);
            current = '';
            continue;
        }

        current += ch;
    }
    if (current.trim()) parts.push(current);
    return parts;
}

// ─── Convert lambdas with balanced paren handling ────────────────────
function convertLambdas(line) {
    // Find all occurrences of "lambda "
    // We iterate backwards/or just repeatedly until no more lambdas found?
    // Or scan forward.

    // While there is a "lambda "
    // 1. Parse args (until :)
    // 2. Parse body (until comma/paren/brace at initial nesting level, or EOL)
    // 3. Replace with arrow func

    // It's safer to do right-to-left? Or just one pass?
    // Let's do a simple scan.

    let regex = /lambda\s+([a-zA-Z0-9_, ]+):/g;
    let match;

    // We need to handle them one by one. Recursion/overlap issues?
    // If we replace one, indices change.
    // Let's execute the regex once, if found, identify the extent of the body, replace, then recurse/loop.

    while ((match = regex.exec(line)) !== null) {
        const startIndex = match.index;
        const args = match[1].trim();
        const colonIndex = startIndex + match[0].length;

        // Scan for body end
        // We need to valid identifiers for body
        // Body ends at:
        // - Comma , (if depth 0 relative to lambda start)
        // - Closing paren ) (if depth < 0 relative to lambda start context... wait)
        // Actually, "lambda" binds very loosely in Python. `f(lambda x: x+1, 2)` -> body is `x+1`
        // `f(lambda x: x+1)` -> body is `x+1`
        // So we scan forward from colonIndex.
        // We need to know initial depth? No, we scan until we hit a terminator that closes the container the lambda is in.
        // But we don't know if we are in a container without scanning from start of line?
        // Heuristic:
        // Count parens/braces/brackets from start of line up to lambda start.
        // But simpler: just scan forward.
        // If we see `,`, it ends the lambda IF the lambda is an argument in a list/call.
        // If we see `)`, it ends the lambda IF it closes the call the lambda is in.

        // Wait, `lambda x: (x, x)` -> body is `(x, x)`
        // `lambda x: func(x)` -> body is `func(x)`

        // Let's count depth starting from 0 at colon.
        // Terminate at `,` if depth == 0.
        // Terminate at `)` if depth < 0.
        // Terminate at `]` if depth < 0.
        // Terminate at `}` if depth < 0.
        // Terminate at EOL.

        let depth = 0;
        let bodyEnd = line.length;

        for (let i = colonIndex; i < line.length; i++) {
            const char = line[i];

            if (char === '(' || char === '[' || char === '{') {
                depth++;
            } else if (char === ')' || char === ']' || char === '}') {
                depth--;
                if (depth < 0) {
                    bodyEnd = i;
                    break;
                }
            } else if (char === ',') {
                if (depth === 0) {
                    bodyEnd = i;
                    break;
                }
            }
        }

        const bodyRaw = line.slice(colonIndex, bodyEnd);
        // Replace
        const arrowArgs = args.includes(',') ? `(${args})` : `(${args})`;
        // Be careful with replacing.
        const left = line.slice(0, startIndex);
        const right = line.slice(bodyEnd);

        // Check if we need to wrap args in parens if seemingly single arg but weird?
        // `($1) => $2` is safe.
        // If args has commas, we need parens: `(x, y) => ...`
        // If args is single `x`, `(x) => ...` is fine.

        const replacement = `${arrowArgs} => ${bodyRaw}`;

        line = left + replacement + right;

        // Reset regex to search again from start (since string changed)
        regex.lastIndex = 0;
    }

    return line;
}

// ─── Should we add a semicolon? ──────────────────────────────────────
function shouldAddSemicolon(line) {
    const trimmed = line.trim();
    if (!trimmed) return false;
    if (trimmed.startsWith('//')) return false;
    if (trimmed.startsWith('/*') || trimmed.startsWith('*')) return false;
    if (trimmed.endsWith('{') || trimmed.endsWith('}')) return false;
    if (trimmed.endsWith(',')) return false;
    if (trimmed.endsWith(';')) return false;
    if (trimmed.startsWith('import') || trimmed.startsWith('export')) return false;
    if (trimmed.startsWith('function') || trimmed.startsWith('async function')) return false;
    if (trimmed.startsWith('class')) return false;
    if (/^(if|else|for|while|switch|try|catch|finally)\b/.test(trimmed)) return false;
    return true;
}

module.exports = { convertPythonToTypeScript };

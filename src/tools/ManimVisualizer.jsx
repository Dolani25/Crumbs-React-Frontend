import React, { useEffect, useRef, useState } from 'react';
import * as Manim from 'manim-web';

const ManimVisualizer = ({ scriptContent }) => {
    const containerRef = useRef(null);
    const [error, setError] = useState(null);
    const sceneRef = useRef(null);
    const progressCircleRef = useRef(null);
    const progressTextRef = useRef(null);
    const rAFRef = useRef(null);

    useEffect(() => {
        let isMounted = true;

        if (containerRef.current && scriptContent) {
            // Start progress tracking loop independent of React renders
            let globalElapsedTime = 0;
            let estimatedTotalTime = 0;
            let isRealPlayRunning = false;
            let currentAnimDuration = 0;
            let realPlayStartTime = 0;

            // Simple regex parser for total duration estimation
            if (scriptContent) {
                try {
                    // Strip comments
                    const clean = scriptContent.replace(/\/\/.*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
                    const playBlocks = clean.split('scene.play');
                    for (let i = 1; i < playBlocks.length; i++) {
                        const block = playBlocks[i].substring(0, playBlocks[i].indexOf(';'));
                        const durations = [...block.matchAll(/(?:duration:\s*|RunTime\(\s*)([\d.]+)/g)].map(m => parseFloat(m[1]));
                        if (durations.length > 0) estimatedTotalTime += Math.max(...durations);
                        else estimatedTotalTime += 1.0;
                    }
                    const waitMatches = [...clean.matchAll(/scene\.wait\(\s*([\d.]+)\s*\)/g)];
                    for (const m of waitMatches) estimatedTotalTime += parseFloat(m[1]);

                    if (estimatedTotalTime === 0) estimatedTotalTime = 1;
                } catch (e) {
                    estimatedTotalTime = 1;
                }
            }

            const updateProgress = () => {
                if (sceneRef.current && progressCircleRef.current && progressTextRef.current) {
                    let currentIterTime = 0;
                    if (isRealPlayRunning) {
                        currentIterTime = sceneRef.current.currentTime || 0;
                        // wait doesn't use timeline, timeline is null and currentTime is 0 during wait
                        if (currentIterTime === 0 && currentAnimDuration > 0) {
                            currentIterTime = (performance.now() - realPlayStartTime) / 1000;
                        }
                        currentIterTime = Math.min(Math.max(currentIterTime, 0), currentAnimDuration);
                    }

                    const current = globalElapsedTime + currentIterTime;
                    const total = Math.max(current, estimatedTotalTime);

                    let progress = 0;
                    if (total > 0) {
                        progress = Math.min(current / total, 1);
                    }

                    // Circle circumference (r=16 -> 2*PI*16 ≈ 100.53)
                    const circumference = 100.53;
                    const offset = circumference - progress * circumference;
                    progressCircleRef.current.style.strokeDashoffset = offset;

                    // Format time text (e.g. 1.2s / 5.0s)
                    progressTextRef.current.textContent = `${current.toFixed(1)}s / ${total.toFixed(1)}s`;
                }
                rAFRef.current = requestAnimationFrame(updateProgress);
            };
            rAFRef.current = requestAnimationFrame(updateProgress);

            const runScene = async () => {
                try {
                    let codeToRun = scriptContent;
                    console.log("ManimVisualizer raw scriptContent:", scriptContent);

                    // Detect Python code (simple heuristic)
                    if (scriptContent.includes('self.play') || scriptContent.includes('def construct') || scriptContent.includes('class ') || scriptContent.includes('Create(')) {
                        // Check if it already looks like JS (has `new Circle` or `await scene.play`)
                        // If it has `new `, it's likely JS. Python uses `Circle()`.
                        if (!scriptContent.includes('new ') && !scriptContent.includes('await ')) {
                            try {
                                const response = await fetch('/api/convert-manim', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ code: scriptContent }),
                                });
                                const data = await response.json();
                                if (data.error) throw new Error(data.error);
                                codeToRun = data.code;
                                if (isMounted) console.log("Transpiled Manim Code:", codeToRun);
                            } catch (transpileErr) {
                                if (!isMounted) return;
                                console.error("Transpilation failed:", transpileErr);
                                setError(`Transpilation failed: ${transpileErr.message}`);
                                return;
                            }
                        }
                    }

                    if (!isMounted) return;

                    // Initialize Scene
                    containerRef.current.innerHTML = '';

                    // Default Manim aspect ratio is 16:9
                    const scene = new Manim.Scene(containerRef.current, {
                        width: 800,
                        height: 450,
                        backgroundColor: '#000000',
                    });
                    sceneRef.current = scene;

                    // --- TIME TRACKING POLYFILLS ---
                    const origPlay = scene.play.bind(scene);
                    scene.play = async (...anims) => {
                        // Filter out null/undefined animations that cause _dirty crashes
                        const validAnims = anims.filter(a => a != null);
                        if (validAnims.length === 0) {
                            console.warn('ManimVisualizer: scene.play called with no valid animations, skipping');
                            return;
                        }

                        isRealPlayRunning = true;
                        realPlayStartTime = performance.now();
                        let maxD = 1;
                        for (const a of validAnims) {
                            if (a && a.__isConfig && a.duration !== undefined) maxD = a.duration;
                            else if (a && a._duration !== undefined) maxD = Math.max(maxD, a._duration);
                            else if (a && a._options && a._options.duration !== undefined) maxD = Math.max(maxD, a._options.duration);
                        }
                        currentAnimDuration = maxD;

                        try {
                            await origPlay(...validAnims);
                        } catch (playErr) {
                            console.warn('ManimVisualizer: scene.play failed, skipping animation batch:', playErr.message);
                        }

                        globalElapsedTime += maxD;
                        isRealPlayRunning = false;
                        currentAnimDuration = 0;
                    };

                    const origWait = scene.wait.bind(scene);
                    scene.wait = async (dur = 1) => {
                        isRealPlayRunning = true;
                        realPlayStartTime = performance.now();
                        currentAnimDuration = dur;

                        await origWait(dur);

                        globalElapsedTime += dur;
                        isRealPlayRunning = false;
                        currentAnimDuration = 0;
                    };

                    // --- RENDER ERROR GUARD ---
                    // Wrap the scene instance's _render to catch Three.js null-child errors
                    // and stop the render loop after repeated failures (prevents console spam).
                    {
                        let renderErrorCount = 0;
                        const MAX_RENDER_ERRORS = 5;

                        // Wrap _render on the instance (not prototype) so it intercepts
                        // the requestAnimationFrame loop set up by _startRenderLoop
                        if (typeof scene._render === 'function') {
                            const origRender = scene._render.bind(scene);
                            scene._render = function (...args) {
                                if (scene._renderStopped) return;
                                try {
                                    origRender(...args);
                                    renderErrorCount = 0; // reset on success
                                } catch (e) {
                                    renderErrorCount++;
                                    if (renderErrorCount >= MAX_RENDER_ERRORS) {
                                        console.error(`ManimVisualizer: ${MAX_RENDER_ERRORS} consecutive render errors â€” stopping render loop.`, e.message);
                                        scene._renderStopped = true;
                                    }
                                }
                            };
                        }

                        // Also guard the Three.js renderer itself (scene.renderer is a WebGLRenderer)
                        const renderer = scene.renderer || scene._renderer;
                        if (renderer && typeof renderer.render === 'function') {
                            const origWebGLRender = renderer.render.bind(renderer);
                            renderer.render = function (threeScene, camera) {
                                // Recursively remove null children that crash projectObject
                                const cleanChildren = (obj) => {
                                    if (!obj || !obj.children) return;
                                    for (let i = obj.children.length - 1; i >= 0; i--) {
                                        if (obj.children[i] == null) {
                                            obj.children.splice(i, 1);
                                        } else {
                                            cleanChildren(obj.children[i]);
                                        }
                                    }
                                };
                                if (threeScene) cleanChildren(threeScene);
                                return origWebGLRender(threeScene, camera);
                            };
                        }
                    }

                    // --- 1. Helper: Hybrid Class Wrapper (allows new Circle() or Circle()) ---
                    const createHybridClass = (OriginalClass) => {
                        // If it's not a class/function, return as is
                        if (typeof OriginalClass !== 'function') return OriginalClass;

                        const Wrapper = function (...args) {
                            const instance = new OriginalClass(...args);

                            // Return Proxy to handle index access (vgroup[i])
                            return new Proxy(instance, {
                                get(target, prop, receiver) {
                                    // Check if prop is integer string
                                    if (typeof prop === 'string' && !isNaN(prop) &&
                                        Number.isInteger(parseFloat(prop)) &&
                                        !Object.prototype.hasOwnProperty.call(target, prop)) {
                                        // If instance doesn't have prop, try submobjects[i]
                                        const index = parseInt(prop, 10);
                                        if (target.submobjects && target.submobjects[index]) {
                                            return target.submobjects[index];
                                        }
                                    }
                                    return Reflect.get(target, prop, receiver);
                                }
                            });
                        };

                        // Copy prototype to ensure instanceof checks work
                        if (OriginalClass.prototype) {
                            Wrapper.prototype = OriginalClass.prototype;
                        }

                        // Copy static properties
                        Object.getOwnPropertyNames(OriginalClass).forEach(prop => {
                            if (prop !== 'prototype' && prop !== 'length' && prop !== 'name') {
                                try {
                                    Object.defineProperty(Wrapper, prop, Object.getOwnPropertyDescriptor(OriginalClass, prop));
                                } catch (e) { }
                            }
                        });

                        return Wrapper;
                    };

                    // --- 2. Helper: Polyfill Prototypes (snake_case -> camelCase) ---
                    const polyfillPrototypes = (classes) => {
                        const snakeToCamel = {
                            'get_end': 'getEnd',
                            'get_start': 'getStart',
                            'get_length': 'getLength',
                            'get_center': 'getCenter',
                            'get_top': 'getTop',
                            'get_bottom': 'getBottom',
                            'get_left': 'getLeft',
                            'get_right': 'getRight',
                            'set_color': 'setColor',
                            'set_opacity': 'setOpacity',
                            'set_stroke': 'setStroke',
                            'set_stroke_width': 'setStrokeWidth',
                            'set_fill': 'setFill',
                            'set_fill_opacity': 'setFillOpacity',
                            'move_to': 'moveTo',
                            'to_corner': 'toCorner',
                            'to_edge': 'toEdge',
                            'next_to': 'nextTo',
                            'align_to': 'alignTo',
                            'shift': 'shift',
                            'rotate': 'rotate',
                            'rotate_in_place': 'rotate',
                            'scale': 'scale',
                            'scale_in_place': 'scale',
                            'set_x': 'setX',
                            'set_y': 'setY',
                            'set_z': 'setZ',
                            'get_direction': 'getDirection',
                            'get_angle': 'getAngle',
                            'get_tip_length': 'getTipLength',
                            'get_tip_width': 'getTipWidth',
                            'set_tip_length': 'setTipLength',
                            'set_tip_width': 'setTipWidth',
                            'add_updater': 'addUpdater',
                            'remove_updater': 'removeUpdater',
                            'clear_updaters': 'clearUpdaters',
                            'add': 'add',
                            'remove': 'remove'
                        };

                        classes.forEach(cls => {
                            if (!cls || !cls.prototype) return;
                            Object.entries(snakeToCamel).forEach(([snake, camel]) => {
                                if (typeof cls.prototype[camel] === 'function' && !cls.prototype[snake]) {
                                    cls.prototype[snake] = cls.prototype[camel];
                                }
                            });
                        });

                        // Axes Specific
                        if (Manim.Axes && Manim.Axes.prototype) {
                            // Polyfill getGraph (camelCase)
                            Manim.Axes.prototype.getGraph = function (func, options = {}) {
                                let actualOptions = {};
                                let xRange = null;

                                if (Array.isArray(options)) {
                                    xRange = options;
                                    actualOptions = arguments[2] || {};
                                } else if (options) {
                                    actualOptions = { ...options };
                                    if (actualOptions.x_range) {
                                        actualOptions.xRange = actualOptions.x_range;
                                        delete actualOptions.x_range;
                                    }
                                }

                                if (xRange && !actualOptions.xRange) {
                                    actualOptions.xRange = xRange;
                                }

                                // Default to axes xRange if none provided
                                if (!actualOptions.xRange && this.xRange) {
                                    actualOptions.xRange = [this.xRange[0], this.xRange[1]];
                                }

                                if (Manim.FunctionGraph) {
                                    return new Manim.FunctionGraph({
                                        func: func,
                                        axes: this,
                                        ...actualOptions
                                    });
                                }

                                return new Manim.VMobject();
                            };

                            // Alias snake_case
                            Manim.Axes.prototype.get_graph = Manim.Axes.prototype.getGraph;

                            if (!Manim.Axes.prototype.plot) Manim.Axes.prototype.plot = Manim.Axes.prototype.getGraph;
                            if (!Manim.Axes.prototype.get_axis_labels) Manim.Axes.prototype.get_axis_labels = Manim.Axes.prototype.getAxisLabels;
                        }

                        // Mobject Directional Polyfills (moveUp, etc.)
                        // We check a representative class like VMobject or Mobject directly if exposed
                        const Mobject = Manim.Mobject;
                        if (Mobject && Mobject.prototype && Mobject.prototype.shift) {
                            if (!Mobject.prototype.moveUp) Mobject.prototype.moveUp = function (d = 1) { return this.shift([0, d, 0]); };
                            if (!Mobject.prototype.moveDown) Mobject.prototype.moveDown = function (d = 1) { return this.shift([0, -d, 0]); };
                            if (!Mobject.prototype.moveLeft) Mobject.prototype.moveLeft = function (d = 1) { return this.shift([-d, 0, 0]); };
                            if (!Mobject.prototype.moveRight) Mobject.prototype.moveRight = function (d = 1) { return this.shift([d, 0, 0]); };

                            // Coordinate Accessors
                            if (!Mobject.prototype.getX) Mobject.prototype.getX = function () { return this.getCenter()[0]; };
                            if (!Mobject.prototype.getY) Mobject.prototype.getY = function () { return this.getCenter()[1]; };
                            if (!Mobject.prototype.getZ) Mobject.prototype.getZ = function () { return this.getCenter()[2]; };

                            // Safe Add Wrapper (prevent adding nulls to scene)
                            const originalAdd = Mobject.prototype.add;
                            Mobject.prototype.add = function (...mobjects) {
                                const validMobjects = mobjects.filter(m => m !== undefined && m !== null);
                                if (validMobjects.length < mobjects.length) {
                                    console.warn('ManimVisualizer: Prevented adding null/undefined mobjects via Mobject.add');
                                }
                                return originalAdd.apply(this, validMobjects);
                            };
                        }

                        if (Manim.Scene && Manim.Scene.prototype && Manim.Scene.prototype.add) {
                            const originalSceneAdd = Manim.Scene.prototype.add;
                            Manim.Scene.prototype.add = function (...mobjects) {
                                const validMobjects = mobjects.filter(m => m !== undefined && m !== null);
                                if (validMobjects.length < mobjects.length) {
                                    console.warn('ManimVisualizer: Prevented adding null/undefined mobjects via Scene.add');
                                }
                                // Add mobjects one-by-one so a single broken one doesn't prevent others
                                for (const mob of validMobjects) {
                                    try {
                                        originalSceneAdd.call(this, mob);
                                    } catch (e) {
                                        console.warn('ManimVisualizer: Scene.add failed for a mobject, skipping:', e.message);
                                    }
                                }
                                return this;
                            };
                        }
                    };

                    // --- 3. Define Safe Wrappers (Override specific classes) ---
                    class SafeText extends Manim.Text {
                        constructor(textOrOptions, ...args) {
                            if (textOrOptions === undefined || textOrOptions === null) textOrOptions = "";
                            if (typeof textOrOptions === 'string' || typeof textOrOptions === 'number') {
                                const options = args[0] || {};
                                if (typeof options === 'string') {
                                    super({ text: String(textOrOptions), color: options });
                                } else {
                                    super({ text: String(textOrOptions), ...options });
                                }
                            } else if (typeof textOrOptions === 'object') {
                                super(textOrOptions);
                            } else {
                                super({ text: String(textOrOptions) });
                            }
                        }
                    }

                    class SafeMathTex extends Manim.MathTex {
                        constructor(latexOrOptions, ...args) {
                            if (latexOrOptions === undefined || latexOrOptions === null) latexOrOptions = "";

                            // Sanitize unicode if string (e.g. 'Âµ' -> '\\mu')
                            const sanitize = (str) => {
                                if (typeof str !== 'string') return str;
                                return str.replace(/Âµ/g, '\\mu').replace(/â‰ /g, '\\neq');
                            };

                            if (typeof latexOrOptions === 'string') {
                                const sanitized = sanitize(latexOrOptions);
                                const options = args[0] || {};
                                if (typeof options === 'string') {
                                    super({ latex: sanitized, color: options });
                                } else {
                                    super({ latex: sanitized, ...options });
                                }
                            } else if (typeof latexOrOptions === 'object') {
                                if (Array.isArray(latexOrOptions)) {
                                    // Sanitize array elements?
                                    const sanitized = latexOrOptions.map(sanitize);
                                    const options = args[0] || {};
                                    super({ latex: sanitized, ...options });
                                } else {
                                    if (latexOrOptions.latex) latexOrOptions.latex = sanitize(latexOrOptions.latex);
                                    super(latexOrOptions);
                                }
                            } else {
                                super({ latex: String(latexOrOptions) });
                            }
                        }
                    }

                    // --- 4. Build manimLib (The User Scope) ---
                    // Start with all exports from manim-web
                    const manimLib = { ...Manim };

                    // Auto-alias GRAY -> GREY for compatibility (AI output vs manim-web)
                    Object.keys(manimLib).forEach(key => {
                        if (key.startsWith('GRAY')) {
                            const greyKey = key.replace('GRAY', 'GREY');
                            if (!manimLib[greyKey]) {
                                manimLib[greyKey] = manimLib[key];
                            }
                        }
                    });

                    // Explicitly add missing common colors if they don't exist
                    if (!manimLib.LIGHT_GREY) manimLib.LIGHT_GREY = "#BBBBBB";
                    if (!manimLib.LIGHT_GRAY) manimLib.LIGHT_GRAY = "#BBBBBB";
                    if (!manimLib.DARK_GREY) manimLib.DARK_GREY = "#444444";
                    if (!manimLib.DARK_GRAY) manimLib.DARK_GRAY = "#444444";
                    if (!manimLib.GREY) manimLib.GREY = "#888888";
                    if (!manimLib.GREY) manimLib.GREY = "#888888";
                    if (!manimLib.GRAY) manimLib.GRAY = "#888888";

                    // Standard Manim color variants (A=lightest, E=darkest)
                    const colorVariants = {
                        BLUE: ['#C6DBEF', '#6C9BD2', '#58C4DD', '#3B7EA1', '#2A5A7B'],
                        RED: ['#F7A1A3', '#E65A5C', '#FC6255', '#CF3333', '#8B2323'],
                        GREEN: ['#A6D854', '#77B05D', '#83C167', '#5C893A', '#3B5C26'],
                        YELLOW: ['#FFF1B6', '#FFEA94', '#FFFF00', '#E8C11C', '#C7A811'],
                        PURPLE: ['#D4B6E8', '#B07EC5', '#9A72AC', '#7B4F8E', '#5C3D6E'],
                        TEAL: ['#ACEAD7', '#76DAC8', '#5CD0B3', '#49A88F', '#38826E'],
                        GOLD: ['#F9E4A7', '#F0C75E', '#E8A725', '#C78D20', '#A3741B'],
                        MAROON: ['#ECBBB3', '#C2706A', '#A24D46', '#7B3632', '#5E2A26'],
                        PINK: ['#F9D4E2', '#EC92AB', '#D147A0', '#B32080', '#8B1868'],
                        BROWN: ['#E1A158', '#C58339', '#A6661E', '#8B5115', '#724110'],
                        ORANGE: ['#FAD4A6', '#F5BC7A', '#F0A34E', '#D68936', '#BD7021'],
                    };
                    for (const [base, shades] of Object.entries(colorVariants)) {
                        ['A', 'B', 'C', 'D', 'E'].forEach((letter, i) => {
                            const key = `${base}_${letter}`;
                            if (!manimLib[key]) manimLib[key] = shades[i];
                        });
                        if (!manimLib[base]) manimLib[base] = shades[2]; // Default to C variant
                    }


                    // Define direction constants if missing (AI often uses UP_LEFT, UL, etc.)
                    // Standard Manim: UP=[0,1,0], DOWN=[0,-1,0], LEFT=[-1,0,0], RIGHT=[1,0,0]
                    const UP = manimLib.UP || [0, 1, 0];
                    const DOWN = manimLib.DOWN || [0, -1, 0];
                    const LEFT = manimLib.LEFT || [-1, 0, 0];
                    const RIGHT = manimLib.RIGHT || [1, 0, 0];

                    if (!manimLib.UP_LEFT) manimLib.UP_LEFT = [LEFT[0] + UP[0], LEFT[1] + UP[1], 0];
                    if (!manimLib.UP_RIGHT) manimLib.UP_RIGHT = [RIGHT[0] + UP[0], RIGHT[1] + UP[1], 0];
                    if (!manimLib.DOWN_LEFT) manimLib.DOWN_LEFT = [LEFT[0] + DOWN[0], LEFT[1] + DOWN[1], 0];
                    if (!manimLib.DOWN_RIGHT) manimLib.DOWN_RIGHT = [RIGHT[0] + DOWN[0], RIGHT[1] + DOWN[1], 0];

                    // Aliases
                    if (!manimLib.UL) manimLib.UL = manimLib.UP_LEFT;
                    if (!manimLib.UR) manimLib.UR = manimLib.UP_RIGHT;
                    if (!manimLib.DL) manimLib.DL = manimLib.DOWN_LEFT;
                    if (!manimLib.DR) manimLib.DR = manimLib.DOWN_RIGHT;

                    // 3D direction constants
                    if (!manimLib.OUT) manimLib.OUT = [0, 0, 1];
                    if (!manimLib.IN) manimLib.IN = [0, 0, -1];
                    if (!manimLib.ORIGIN) manimLib.ORIGIN = [0, 0, 0];

                    // always_redraw: creates a mobject from a factory fn, re-calling it each frame
                    // In manim-web this is typically not available, so we polyfill it:
                    // Just call the factory once and return the result (no continuous redraw)
                    if (!manimLib.always_redraw) {
                        manimLib.always_redraw = (factory) => {
                            try {
                                return factory();
                            } catch (e) {
                                console.warn('ManimVisualizer: always_redraw factory failed:', e);
                                return new manimLib.VMobject();
                            }
                        };
                    }
                    if (!manimLib.always) {
                        manimLib.always = (func) => {
                            try { func(); } catch (e) { console.warn("always() initial call failed:", e); }
                            return { add_updater: () => { }, become: () => { } };
                        };
                    }

                    // Polyfill Point class (often used for anchors)
                    if (!manimLib.Point && manimLib.VMobject) {
                        manimLib.Point = class Point extends manimLib.VMobject {
                            constructor(location = [0, 0, 0], ...args) {
                                super(...args);
                                this.setPoints([location]);
                            }
                        };
                    }

                    // Global Vector Utils (for transpiler to replace +/* with)
                    manimLib.addVectors = (v1, v2) => {
                        if (!Array.isArray(v1) || !Array.isArray(v2)) return v1; // Fallback
                        return v1.map((x, i) => x + (v2[i] || 0));
                    };
                    manimLib.subVectors = (v1, v2) => {
                        if (!Array.isArray(v1) || !Array.isArray(v2)) return v1;
                        return v1.map((x, i) => x - (v2[i] || 0));
                    };
                    // Alias subtractVectors for convenience
                    manimLib.subtractVectors = manimLib.subVectors;

                    manimLib.multVector = (a, b) => {
                        if (Array.isArray(a) && typeof b === 'number') return a.map(x => x * b);
                        if (typeof a === 'number' && Array.isArray(b)) return b.map(x => x * a);
                        return a;
                    };
                    if (!manimLib.scaleVec) manimLib.scaleVec = manimLib.multVector;

                    // --- DEEP ANIMATION POLYFILLS ---
                    // 1. Allow chaining .setDuration() / .set_run_time() on ANY Animation object
                    //    (The AI often does .animate.method().set_run_time(2))
                    if (manimLib.Animation) {
                        manimLib.Animation.prototype.setDuration = function (duration) {
                            this.duration = duration;
                            return this;
                        };
                        manimLib.Animation.prototype.set_run_time = manimLib.Animation.prototype.setDuration;

                        // Polyfill setRate (often used for speed multiplier)
                        manimLib.Animation.prototype.setRate = function (rate) {
                            if (typeof rate === 'number' && this.duration) {
                                this.duration /= rate;
                            }
                            return this;
                        };
                        manimLib.Animation.prototype.set_rate = manimLib.Animation.prototype.setRate;

                        const chainableMobjectMethods = [
                            'shift', 'scale', 'rotate', 'moveTo', 'move_to', 'nextTo', 'next_to', 'toEdge', 'to_edge', 'toCorner', 'to_corner',
                            'alignTo', 'align_to', 'arrange', 'set_color', 'set_fill', 'set_stroke',
                            'set_opacity', 'setZ', 'setX', 'setY', 'center', 'flip', 'stretch'
                        ];

                        chainableMobjectMethods.forEach(method => {
                            if (!manimLib.Animation.prototype[method]) {
                                manimLib.Animation.prototype[method] = function (...args) {
                                    // Robust target resolution: _targetMobject is usually our copy, mobject is original
                                    const target = this._targetMobject || this.mobject;
                                    if (target && typeof target[method] === 'function') {
                                        target[method](...args);
                                    } else {
                                        console.warn(`Chainable method ${method} failed on Animation: target or method not found.`);
                                    }
                                    return this;
                                };
                            }
                        });
                    }

                    // 1a. Polyfill TransformFromCopy and ReplacementTransform if missing
                    if (manimLib.Transform) {
                        if (!manimLib.TransformFromCopy) {
                            manimLib.TransformFromCopy = class TransformFromCopy extends manimLib.Transform {
                                constructor(mobject, target, ...args) {
                                    // Manim logic: source remains, copy transforms into target
                                    // We pass a copy of mobject to Transform
                                    // Need to check if copy() exists. Most Mobjects have it.
                                    // If not, we might be in trouble, but let's assume it does or shallow clone.
                                    let copy = mobject;
                                    if (mobject && typeof mobject.copy === 'function') {
                                        copy = mobject.copy();
                                    } else if (mobject && typeof mobject.clone === 'function') {
                                        copy = mobject.clone(); // Three.js style
                                    }

                                    // We must add the copy to the scene? 
                                    // In standard Manim, TransformFromCopy adds the copy.
                                    // But here we are just defining the animation. 
                                    // The Play call handles the 'add' usually? 
                                    // Actually, standard Manim Transform replaces mobject with target on completion.
                                    // TransformFromCopy: mobject is unchanged. Copy appears and transforms to target.

                                    super(copy, target, ...args);
                                    this.originalMobject = mobject; // Keep ref if needed
                                }

                                // On finish, we might need to ensure target replaces copy? 
                                // Transform usually handles becoming target.
                            }
                        }

                        if (!manimLib.ReplacementTransform) {
                            // ReplacementTransform is basically Transform but removes source? 
                            // In manim-web, Transform might already behave like ReplacementTransform (target replaces source).
                            // Let's alias it to Transform for now to prevent crash.
                            manimLib.ReplacementTransform = manimLib.Transform;
                        }
                    }

                    // 1b. Polyfill VMobject methods (put_start_and_end_on, put_start_and_end_relative_to)
                    if (manimLib.VMobject) {
                        manimLib.VMobject.prototype.putStartAndEndOn = function (start, end) {
                            // Ensure start/end are 3D points
                            const s = start.length === 2 ? [...start, 0] : start;
                            const e = end.length === 2 ? [...end, 0] : end;
                            this.setPointsAsCorners([s, e]);
                            return this;
                        };
                        manimLib.VMobject.prototype.put_start_and_end_on = manimLib.VMobject.prototype.putStartAndEndOn;

                        // Polyfill applyPointwiseFunction (often used for warping points)
                        // This allows .animate.applyPointwiseFunction to work safely by routing to native applyFunction
                        manimLib.VMobject.prototype.applyPointwiseFunction = function (func) {
                            if (typeof this.applyFunction === 'function') {
                                return this.applyFunction(func);
                            }
                            return this;
                        };
                        manimLib.VMobject.prototype.apply_pointwise_function = manimLib.VMobject.prototype.applyPointwiseFunction;
                        manimLib.VMobject.prototype.apply_function = manimLib.VMobject.prototype.applyPointwiseFunction;

                        // Polyfill addTip (Python Manim adds an arrowhead at the end of a curve)
                        if (!manimLib.VMobject.prototype.addTip) {
                            manimLib.VMobject.prototype.addTip = function (options = {}) {
                                // Safe no-op that returns this for chaining
                                // A full implementation would create a Triangle submobject at getEnd()
                                try {
                                    if (manimLib.ArrowTip && typeof this.getEnd === 'function') {
                                        const tip = new manimLib.ArrowTip(options);
                                        tip.moveTo(this.getEnd());
                                        this.add(tip);
                                    }
                                } catch (e) {
                                    console.warn('ManimVisualizer: addTip fallback (no-op)', e);
                                }
                                return this;
                            };
                            manimLib.VMobject.prototype.add_tip = manimLib.VMobject.prototype.addTip;
                        }

                        // Polyfill reversePoints (Python Manim reverses the bezier path direction)
                        if (!manimLib.VMobject.prototype.reversePoints) {
                            manimLib.VMobject.prototype.reversePoints = function () {
                                try {
                                    const pts = this.getPoints ? this.getPoints() : [];
                                    if (pts && pts.length) {
                                        this.setPoints(pts.reverse());
                                    }
                                } catch (e) {
                                    console.warn('ManimVisualizer: reversePoints fallback (no-op)', e);
                                }
                                return this;
                            };
                            manimLib.VMobject.prototype.reverse_points = manimLib.VMobject.prototype.reversePoints;
                        }

                        // Polyfill copy (Python Manim .copy() creates a deep clone)
                        if (!manimLib.VMobject.prototype.copy) {
                            manimLib.VMobject.prototype.copy = function () {
                                try {
                                    if (typeof this.clone === 'function') return this.clone();
                                } catch (e) {
                                    console.warn('ManimVisualizer: copy() fell back to self', e);
                                }
                                return this; // Fallback: return self if clone not available
                            };
                        }

                        // Polyfill getEndPoint â†’ get_end (used by axis.getEndPoint())
                        if (!manimLib.VMobject.prototype.getEndPoint) {
                            manimLib.VMobject.prototype.getEndPoint = function () {
                                if (this.get_end) return this.get_end();
                                if (this.getEnd) return this.getEnd();
                                const pts = this.getPoints ? this.getPoints() : [];
                                return pts.length ? pts[pts.length - 1] : [0, 0, 0];
                            };
                        }
                        if (!manimLib.VMobject.prototype.getStartPoint) {
                            manimLib.VMobject.prototype.getStartPoint = function () {
                                if (this.get_start) return this.get_start();
                                if (this.getStart) return this.getStart();
                                const pts = this.getPoints ? this.getPoints() : [];
                                return pts.length ? pts[0] : [0, 0, 0];
                            };
                        }

                        // Polyfill waitForRender (Tex objects in transpiled code use await tex.waitForRender())
                        if (!manimLib.VMobject.prototype.waitForRender) {
                            manimLib.VMobject.prototype.waitForRender = async function () {
                                // Small delay to allow any async rendering to complete
                                await new Promise(r => setTimeout(r, 50));
                                return this;
                            };
                        }

                        // Batch camelCase â†’ snake_case polyfills for VMobject
                        // The AI transpiler outputs camelCase but manim-web often uses snake_case
                        const vmMethodMappings = {
                            pointFromProportion: 'point_from_proportion',
                            setColor: 'set_color',
                            setFill: 'set_fill',
                            setStroke: 'set_stroke',
                            setStrokeWidth: 'set_stroke_width',
                            setOpacity: 'set_opacity',
                            setFillOpacity: 'set_fill_opacity',
                            setStrokeOpacity: 'set_stroke_opacity',
                            getCenter: 'get_center',
                            getLeft: 'get_left',
                            getRight: 'get_right',
                            getTop: 'get_top',
                            getBottom: 'get_bottom',
                            getWidth: 'get_width',
                            getHeight: 'get_height',
                            moveTo: 'move_to',
                            nextTo: 'next_to',
                            alignTo: 'align_to',
                            toEdge: 'to_edge',
                            toCorner: 'to_corner',
                            setWidth: 'set_width',
                            setHeight: 'set_height',
                            arrangeSubmobjects: 'arrange_submobjects',
                            getPoints: 'get_points',
                            setPoints: 'set_points',
                        };
                        for (const [camel, snake] of Object.entries(vmMethodMappings)) {
                            if (!manimLib.VMobject.prototype[camel] && manimLib.VMobject.prototype[snake]) {
                                manimLib.VMobject.prototype[camel] = manimLib.VMobject.prototype[snake];
                            }
                            // Also map snake_case â†’ camelCase in case it's the other direction
                            if (!manimLib.VMobject.prototype[snake] && manimLib.VMobject.prototype[camel]) {
                                manimLib.VMobject.prototype[snake] = manimLib.VMobject.prototype[camel];
                            }
                        }

                        // pointFromProportion fallback: if neither exists, create a basic implementation
                        if (!manimLib.VMobject.prototype.pointFromProportion) {
                            manimLib.VMobject.prototype.pointFromProportion = function (alpha) {
                                try {
                                    const clampedAlpha = Math.max(0, Math.min(1, alpha));

                                    // For Line objects: use start/end config for linear interpolation
                                    // This works even before Three.js geometry is initialized
                                    const s = this._start || this.start;
                                    const e = this._end || this.end;
                                    if (s && e && Array.isArray(s) && Array.isArray(e)) {
                                        return [
                                            s[0] + clampedAlpha * (e[0] - s[0]),
                                            s[1] + clampedAlpha * (e[1] - s[1]),
                                            (s[2] || 0) + clampedAlpha * ((e[2] || 0) - (s[2] || 0)),
                                        ];
                                    }

                                    // Generic: use internal points array
                                    const pts = (this.getPoints || this.get_points)?.call(this) || [];
                                    if (!pts.length) return [0, 0, 0];
                                    const idx = clampedAlpha * (pts.length - 1);
                                    const lo = Math.floor(idx);
                                    const hi = Math.min(lo + 1, pts.length - 1);
                                    const t = idx - lo;
                                    const p0 = pts[lo] || [0, 0, 0];
                                    const p1 = pts[hi] || [0, 0, 0];
                                    return [
                                        p0[0] + t * (p1[0] - p0[0]),
                                        p0[1] + t * (p1[1] - p0[1]),
                                        p0[2] + t * (p1[2] - p0[2]),
                                    ];
                                } catch (e) {
                                    console.warn('pointFromProportion fallback:', e);
                                    return [0, 0, 0];
                                }
                            };
                            manimLib.VMobject.prototype.point_from_proportion = manimLib.VMobject.prototype.pointFromProportion;
                        }

                        // getVector: returns direction vector (end - start), commonly used for Arrow/Line
                        if (!manimLib.VMobject.prototype.getVector) {
                            manimLib.VMobject.prototype.getVector = function () {
                                try {
                                    const s = this.getStart ? this.getStart() : (this._start || this.start || [0, 0, 0]);
                                    const e = this.getEnd ? this.getEnd() : (this._end || this.end || [0, 0, 0]);
                                    const sv = Array.isArray(s) ? s : [0, 0, 0];
                                    const ev = Array.isArray(e) ? e : [0, 0, 0];
                                    return [
                                        ev[0] - sv[0],
                                        ev[1] - sv[1],
                                        (ev[2] || 0) - (sv[2] || 0),
                                    ];
                                } catch (err) {
                                    console.warn('getVector fallback:', err);
                                    return [0, 0, 0];
                                }
                            };
                            manimLib.VMobject.prototype.get_vector = manimLib.VMobject.prototype.getVector;
                        }

                        // getStart / getEnd fallbacks (some objects store start/end but lack these methods)
                        if (!manimLib.VMobject.prototype.getStart) {
                            manimLib.VMobject.prototype.getStart = function () {
                                const pts = (this.getPoints || this.get_points)?.call(this) || [];
                                return pts[0] || this._start || this.start || [0, 0, 0];
                            };
                            manimLib.VMobject.prototype.get_start = manimLib.VMobject.prototype.getStart;
                        }
                        if (!manimLib.VMobject.prototype.getEnd) {
                            manimLib.VMobject.prototype.getEnd = function () {
                                const pts = (this.getPoints || this.get_points)?.call(this) || [];
                                return pts[pts.length - 1] || this._end || this.end || [0, 0, 0];
                            };
                            manimLib.VMobject.prototype.get_end = manimLib.VMobject.prototype.getEnd;
                        }
                    }

                    // 1c. Polyfill Missing Animations (GrowArrow, Indicate, Flash, etc.)
                    //     Many AI generated scripts use these standard Manim animations.
                    if (!manimLib.GrowArrow) {
                        // GrowArrow is essentially creation of an arrow.
                        // Alias to Create or ShowCreation if available, else standard Animation
                        manimLib.GrowArrow = manimLib.Create || manimLib.ShowCreation || manimLib.Write || manimLib.Animation;
                    }
                    if (!manimLib.Indicate) {
                        // Indicate flashes color and scales up. 
                        // Fallback to minimal animation or just Wait?
                        // Better to alias to Wiggle or ApplyMethod(scale...)?
                        // Simplest fallback: Animation (no-op visual but takes time)
                        manimLib.Indicate = manimLib.Wiggle || manimLib.Animation;
                    }
                    if (!manimLib.Flash) {
                        manimLib.Flash = manimLib.Indicate || manimLib.Animation;
                    }


                    // Polyfill addCoordinates for Axes/NumberPlane/ComplexPlane
                    // AI often uses .addCoordinates() instead of .add_coordinates()
                    const coordinateSystems = [manimLib.Axes, manimLib.NumberPlane, manimLib.ComplexPlane];
                    coordinateSystems.forEach(System => {
                        if (System && System.prototype) {
                            if (!System.prototype.addCoordinates) {
                                System.prototype.addCoordinates = function (...args) {
                                    if (this.add_coordinates) {
                                        return this.add_coordinates(...args);
                                    }
                                    // Fallback: If add_coordinates doesn't exist, try adding numbers manually? 
                                    // For now, safe no-op to prevent crash.
                                    // console.warn('addCoordinates not implemented on this object');
                                    return this;
                                };
                            }

                            // Polyfill getFunction (AI hallucination for get_graph or plot)
                            if (!System.prototype.getFunction) {
                                System.prototype.getFunction = function (func, xRange, ...args) {
                                    if (this.get_graph) {
                                        return this.get_graph(func, xRange, ...args);
                                    }
                                    if (this.plot) {
                                        return this.plot(func, xRange, ...args);
                                    }
                                    console.warn('getFunction/get_graph not implemented on this coordinate system');
                                    // Return a dummy VMobject to prevent crash in subsequent animations (e.g. Create(graph))
                                    return new manimLib.VMobject();
                                };
                            }

                            // Polyfill getGraph â†’ get_graph (camelCase â†’ snake_case)
                            if (!System.prototype.getGraph) {
                                System.prototype.getGraph = function (...args) {
                                    if (this.get_graph) return this.get_graph(...args);
                                    if (this.plot) return this.plot(...args);
                                    console.warn('getGraph not available');
                                    return new manimLib.VMobject();
                                };
                            }

                            // Polyfill axis getters: getXAxis, getYAxis, getZAxis
                            if (!System.prototype.getXAxis) {
                                System.prototype.getXAxis = function () {
                                    if (this.get_x_axis) return this.get_x_axis();
                                    if (this.x_axis) return this.x_axis;
                                    if (this.axes && this.axes[0]) return this.axes[0];
                                    console.warn('getXAxis not available');
                                    return new manimLib.VMobject();
                                };
                            }
                            if (!System.prototype.getYAxis) {
                                System.prototype.getYAxis = function () {
                                    if (this.get_y_axis) return this.get_y_axis();
                                    if (this.y_axis) return this.y_axis;
                                    if (this.axes && this.axes[1]) return this.axes[1];
                                    console.warn('getYAxis not available');
                                    return new manimLib.VMobject();
                                };
                            }
                            if (!System.prototype.getZAxis) {
                                System.prototype.getZAxis = function () {
                                    if (this.get_z_axis) return this.get_z_axis();
                                    if (this.z_axis) return this.z_axis;
                                    if (this.axes && this.axes[2]) return this.axes[2];
                                    console.warn('getZAxis not available, returning dummy');
                                    return new manimLib.VMobject();
                                };
                            }
                        }
                    });

                    // Heuristic for putStartAndEndRelativeTo(mobject)
                    // Matches the width of the target mobject (Left -> Right)
                    // This is often used for springs under objects.
                    manimLib.VMobject.prototype.putStartAndEndRelativeTo = function (mobject) {
                        if (!mobject) return this;
                        // Default to matching width (Left to Right)
                        // If we wanted to be smarter, we could check if height > width
                        // but springs are usually horizontal in diagrams unless specified.
                        this.putStartAndEndOn(mobject.getLeft(), mobject.getRight());
                        return this;
                    };
                    manimLib.VMobject.prototype.put_start_and_end_relative_to = manimLib.VMobject.prototype.putStartAndEndRelativeTo;

                    // 2. Polyfill ValueTracker.animate to be a Builder Proxy
                    if (manimLib.ValueTracker) {
                        try {
                            if (!manimLib.ValueTracker.prototype.hasOwnProperty('animate')) {
                                const originalAnimate = manimLib.ValueTracker.prototype.animate;
                                Object.defineProperty(manimLib.ValueTracker.prototype, 'animate', {
                                    get() {
                                        const tracker = this;
                                        const fn = originalAnimate.bind(tracker);
                                        return new Proxy(fn, {
                                            get: (target, prop) => {
                                                const propName = String(prop).replace(/_([a-z])/g, g => g[1].toUpperCase());
                                                if (propName === 'setValue' || propName === 'setTarget') {
                                                    return (val) => tracker.animateTo(val);
                                                }
                                                return target[prop];
                                            }
                                        });
                                    },
                                    configurable: true
                                });
                            }
                        } catch (e) {
                            // console.warn('ManimVisualizer: Failed to patch ValueTracker.animate', e);
                        }
                    }

                    // 3. Polyfill ComplexValueTracker similarly
                    if (manimLib.ComplexValueTracker) {
                        try {
                            if (!manimLib.ComplexValueTracker.prototype.hasOwnProperty('animate')) {
                                const originalAnimate = manimLib.ComplexValueTracker.prototype.animate;
                                Object.defineProperty(manimLib.ComplexValueTracker.prototype, 'animate', {
                                    get() {
                                        const tracker = this;
                                        const fn = originalAnimate.bind(tracker);
                                        return new Proxy(fn, {
                                            get: (target, prop) => {
                                                const propName = String(prop).replace(/_([a-z])/g, g => g[1].toUpperCase());
                                                if (propName === 'setValue') {
                                                    return (val) => tracker.animateTo(val);
                                                }
                                                return target[prop];
                                            }
                                        });
                                    },
                                    configurable: true
                                });
                            }
                        } catch (e) {
                            // console.warn('ManimVisualizer: Failed to patch ComplexValueTracker.animate', e);
                        }
                    }

                    // 3b. Universal Animate Polyfill
                    if (manimLib.Mobject && manimLib.MoveToTarget) {
                        try {
                            if (!manimLib.Mobject.prototype.hasOwnProperty('animate')) {
                                Object.defineProperty(manimLib.Mobject.prototype, 'animate', {
                                    get() {
                                        const mobject = this;
                                        return new Proxy({}, {
                                            get: (target, prop) => {
                                                let method = String(prop);
                                                if (method.includes('_')) {
                                                    method = method.replace(/_([a-z])/g, g => g[1].toUpperCase());
                                                }

                                                if (typeof mobject[method] === 'function') {
                                                    return (...args) => {
                                                        mobject.generateTarget();
                                                        if (mobject.targetCopy) {
                                                            mobject.targetCopy[method](...args);
                                                            return new manimLib.MoveToTarget(mobject);
                                                        }
                                                        return null;
                                                    };
                                                }
                                                return mobject[prop];
                                            }
                                        });
                                    },
                                    configurable: true
                                });
                            }
                        } catch (e) {
                            // console.warn('ManimVisualizer: Failed to patch Mobject.animate', e);
                        }
                    }

                    // 3c. Vector Math Polyfills (Array.prototype extensions)
                    //     Functions like LEFT.scale(2) or RIGHT.add(UP) are common in AI code (Numpy style).
                    //     We safely extend Array.prototype for [x, y, z] tuples.
                    const vectorMethods = {
                        scale(factor) { return this.map(x => x * factor); },
                        add(other) { return this.map((x, i) => x + (other[i] || 0)); },
                        subtract(other) { return this.map((x, i) => x - (other[i] || 0)); },
                        multiply(factor) { return this.map(x => x * factor); },
                        divide(divisor) { return this.map(x => x / divisor); },
                    };

                    Object.keys(vectorMethods).forEach(methodName => {
                        if (!Array.prototype[methodName]) {
                            Object.defineProperty(Array.prototype, methodName, {
                                value: vectorMethods[methodName],
                                writable: true,
                                configurable: true
                            });
                        }
                    });

                    // 3d. Ensure Fluent Interface (chaining) for common methods + Safe Add/Remove
                    // Manim-web methods often return void (especially overrides in VMobject/Arc/Circle), breaking chaining.
                    const fluentMethods = [
                        'setOpacity', 'setColor', 'setStroke', 'setFill',
                        'scale', 'rotate', 'shift', 'moveTo', 'nextTo', 'alignTo',
                        'stretch', 'flip', 'fade', 'setPoints', 'setPointsAsCorners',
                        'add', 'remove' // Add safe add/remove to chaining and filtering
                    ];

                    Object.values(manimLib).forEach(Cls => {
                        // Iterate all exported classes/functions to patch prototypes
                        if (typeof Cls === 'function' && Cls.prototype) {
                            fluentMethods.forEach(method => {
                                if (Object.prototype.hasOwnProperty.call(Cls.prototype, method)) {
                                    const original = Cls.prototype[method];
                                    try {
                                        Cls.prototype[method] = function (...args) {
                                            let finalArgs = args;

                                            // Special handling for add/remove: prevent nulls
                                            if (method === 'add' || method === 'remove') {
                                                finalArgs = args.filter(a => a !== undefined && a !== null);
                                                if (finalArgs.length < args.length) {
                                                    console.warn(`ManimVisualizer: Prevented passing null/undefined to ${this.constructor.name}.${method}`);
                                                }
                                            }

                                            const res = original.apply(this, finalArgs);
                                            return res === undefined ? this : res;
                                        };
                                    } catch (e) {
                                        // Ignore if property is read-only
                                    }
                                }
                            });
                        }
                    });

                    // 4. Mobject Array-Like Behavior (Iterator, map, forEach, length)
                    //    Allows `for (const x of vgroup)` and `vgroup.map(...)`.
                    if (manimLib.Mobject && manimLib.Mobject.prototype) {
                        // Add Iterator
                        manimLib.Mobject.prototype[Symbol.iterator] = function* () {
                            // Use 'submobjects' if available, otherwise yield nothing (or self?)
                            // Python iterates over submobjects.
                            const subs = this.submobjects || [];
                            for (let i = 0; i < subs.length; i++) {
                                yield subs[i];
                            }
                        };

                        // Add Array methods if missing
                        const arrayMethods = ['map', 'forEach', 'filter', 'reduce', 'some', 'every', 'find'];
                        arrayMethods.forEach(method => {
                            if (!manimLib.Mobject.prototype[method]) {
                                manimLib.Mobject.prototype[method] = function (callback, ...args) {
                                    const subs = this.submobjects || [];
                                    return subs[method](callback, ...args);
                                };
                            }
                        });

                        // Add length property (getter)
                        if (!Object.getOwnPropertyDescriptor(manimLib.Mobject.prototype, 'length')) {
                            Object.defineProperty(manimLib.Mobject.prototype, 'length', {
                                get() { return (this.submobjects || []).length; }
                            });
                        }

                        // Add 'at' method for indexing (vgroup.at(0))
                        if (!manimLib.Mobject.prototype.at) {
                            manimLib.Mobject.prototype.at = function (index) {
                                const subs = this.submobjects || [];
                                return subs.at(index);
                            }
                        }
                    }

                    // 4. Polyfill RunTime helper and patch Scene.play to support it
                    //    Supports: await scene.play(Create(c), RunTime(2));
                    if (manimLib.Scene) {
                        // Define RunTime helper
                        manimLib.RunTime = (duration) => ({ __isConfig: true, duration });
                    }

                    // 6. Smart Arrays for Vector Accessors (getTop().getX())
                    //    Manim Python returns arrays (numpy) which have no methods like .getX() in JS.
                    //    We patch getCenter/getTop/etc to return "Smart Arrays" with .getX() attached.
                    if (manimLib.Mobject && manimLib.Mobject.prototype) {
                        const vectorMethods = [
                            'getCenter', 'getTop', 'getBottom', 'getLeft', 'getRight',
                            'getStart', 'getEnd', 'getCorner', 'getEdgeCenter'
                        ];

                        // We iterate all methods on Mobject (and potentially VMobject if overridden)
                        // But Mobject is the base.
                        const attachAccessors = (arr) => {
                            if (!Array.isArray(arr)) return arr;
                            // Attach methods if not present
                            if (!arr.getX) arr.getX = function () { return this[0]; };
                            if (!arr.getY) arr.getY = function () { return this[1]; };
                            if (!arr.getZ) arr.getZ = function () { return this[2]; };
                            return arr;
                        };

                        vectorMethods.forEach(method => {
                            // Mobject prototype
                            if (manimLib.Mobject.prototype[method]) {
                                const original = manimLib.Mobject.prototype[method];
                                manimLib.Mobject.prototype[method] = function (...args) {
                                    const res = original.apply(this, args);
                                    return attachAccessors(res);
                                };
                            }
                            // VMobject prototype (often overrides)
                            if (manimLib.VMobject && manimLib.VMobject.prototype && manimLib.VMobject.prototype[method]) {
                                const original = manimLib.VMobject.prototype[method];
                                // Check if it's the same function reference as Mobject to avoid double wrapping?
                                if (original !== manimLib.Mobject.prototype[method]) {
                                    manimLib.VMobject.prototype[method] = function (...args) {
                                        const res = original.apply(this, args);
                                        return attachAccessors(res);
                                    };
                                }
                            }
                        });

                        // Also patch 'points' access?
                        // points usually is big array. User rarely does points.getX().
                    }
                    // 5a. Robust MathTex Fallback (Fix MathJax CDN Timeout/Block)
                    if (manimLib.MathTex && manimLib.MathTex.prototype) {
                        const originalWaitForRender = manimLib.MathTex.prototype.waitForRender;
                        manimLib.MathTex.prototype.waitForRender = async function () {
                            try {
                                if (originalWaitForRender) {
                                    await originalWaitForRender.call(this);
                                }
                            } catch (e) {
                                console.warn("MathTex rendering failed (MathJax blocked?), falling back to Text", e);
                                // Fallback: Create a Text mobject with the latex source string
                                try {
                                    // MathTex stores latex in .tex_string or .latex usually
                                    // But internal structure varies. We can try to guess from constructor args if stored?
                                    // Or just use a generic "LaTeX Error" text.
                                    // SafeMathTex stores options? No, it calls super.

                                    // Use 'latex' property if available (assuming we set it in SafeMathTex or Manim does)
                                    const fallbackText = this.latex || this.tex_string || "LaTeX";

                                    if (manimLib.Text) {
                                        const textMob = new manimLib.Text({
                                            text: String(fallbackText),
                                            color: this.color || manimLib.WHITE,
                                            font_size: 24
                                        });
                                        // Add text as submobject so it renders
                                        this.add(textMob);
                                    }
                                } catch (fallbackError) {
                                    console.error("MathTex fallback failed", fallbackError);
                                }
                            }
                        };
                    }

                    // 5. Update Scene.play to handle plain config objects (like {duration: 2})
                    if (manimLib.Scene && manimLib.Scene.prototype) {
                        const originalPlay = manimLib.Scene.prototype.play;
                        manimLib.Scene.prototype.play = async function (...args) {
                            const animations = [];
                            let config = {};

                            // Separate animations from config objects
                            for (const arg of args) {
                                // 1. Check for helper object (RunTime(...))
                                if (arg && arg.__isConfig) {
                                    Object.assign(config, arg);
                                    continue;
                                }

                                // 2. Check for plain config object (e.g. { duration: 2 }) passed as last arg
                                // Distinguished from Animation/Mobject by constructor check (Animation vs Object)
                                if (arg && typeof arg === 'object' && arg.constructor === Object) {
                                    // Also check if it has relevant keys to be sure
                                    if (arg.duration !== undefined || arg.run_time !== undefined || arg.rate_func !== undefined) {
                                        Object.assign(config, arg);
                                        continue;
                                    }
                                }

                                if (arg != null) {
                                    animations.push(arg);
                                }
                            }

                            // Normalize config keys
                            if (config.run_time !== undefined && config.duration === undefined) {
                                config.duration = config.run_time;
                            }

                            // Apply config to all animations in this batch
                            if (config.duration !== undefined) {
                                animations.forEach(anim => {
                                    // Handle direct property set
                                    if (anim && typeof anim === 'object') {
                                        if ('duration' in anim) {
                                            anim.duration = config.duration;
                                        }
                                        // Also try setDuration logger if available (from our polyfill)
                                        if (typeof anim.setDuration === 'function') {
                                            anim.setDuration(config.duration);
                                        }
                                    }
                                });
                            }

                            try {
                                return await originalPlay.apply(this, animations);
                            } catch (e) {
                                console.warn('ManimVisualizer: scene.play failed, skipping animation batch:', e.message);
                            }
                        };

                    }

                    // 6b. Safe LaggedStart/AnimationGroup (Config Object Support)
                    //     Interprets {lagRatio: 0.2} as config, not animation.
                    const wrapAnimationGroup = (OriginalClass) => {
                        if (!OriginalClass) return OriginalClass;
                        return class SafeAnimationGroupWrapper extends OriginalClass {
                            constructor(...args) {
                                let config = {};
                                const lastArg = args[args.length - 1];

                                // Check if last arg is config object (and not a Mobject/Animation)
                                if (lastArg && typeof lastArg === 'object' && lastArg.constructor === Object && !lastArg._targetMobject) {
                                    // Check for known config keys or just assume it's config if it's a plain object
                                    if (lastArg.lagRatio !== undefined || lastArg.lag_ratio !== undefined ||
                                        lastArg.run_time !== undefined || lastArg.rate_func !== undefined ||
                                        lastArg.group !== undefined || lastArg.duration !== undefined) {
                                        config = args.pop();
                                    }
                                }

                                // manim-web expects an array of animations as the first argument
                                let anims = args;
                                if (args.length === 1 && Array.isArray(args[0])) {
                                    anims = args[0];
                                }

                                super(anims, config);

                                // Apply config properties manually just in case
                                if (config.lagRatio !== undefined) this.lag_ratio = config.lagRatio;
                                if (config.lag_ratio !== undefined) this.lag_ratio = config.lag_ratio;
                                if (config.run_time !== undefined) this.run_time = config.run_time;
                                Object.assign(this, config);
                            }
                        };
                    };

                    if (manimLib.LaggedStart) manimLib.LaggedStart = wrapAnimationGroup(manimLib.LaggedStart);
                    if (manimLib.AnimationGroup) manimLib.AnimationGroup = wrapAnimationGroup(manimLib.AnimationGroup);

                    // Apply Overrides
                    manimLib.Text = createHybridClass(SafeText);
                    manimLib.MathTex = createHybridClass(SafeMathTex);

                    // Collect all classes for polyfilling
                    const classesToPolyfill = [];

                    // Iterate all keys in manimLib to wrap classes and collect for polyfills
                    Object.keys(manimLib).forEach(key => {
                        const val = manimLib[key];
                        // If it's a class (function with prototype), wrap it (unless already wrapped above)
                        if (typeof val === 'function' && val.prototype && key !== 'Text' && key !== 'MathTex') {
                            // Check if it's likely a Manim class (has typically Mobject methods or is in our interest)
                            // We allow all functions to be wrapped to be safe for "no-new" usage
                            manimLib[key] = createHybridClass(val);
                            classesToPolyfill.push(val);
                        }
                    });

                    // Add safe classes to polyfill list too
                    classesToPolyfill.push(SafeText, SafeMathTex);

                    // Helper to patch Mobject methods (getX, setX, moveTo, etc.)
                    const patchMobjectMethods = (cls) => {
                        if (!cls || !cls.prototype) return;

                        // 0. Python aliases
                        if (cls.prototype.getCenter) cls.prototype.get_center = cls.prototype.getCenter;
                        if (cls.prototype.setColor) cls.prototype.set_color = cls.prototype.setColor;
                        if (cls.prototype.setFill) cls.prototype.set_fill = cls.prototype.setFill;
                        if (cls.prototype.setStroke) cls.prototype.set_stroke = cls.prototype.setStroke;
                        if (cls.prototype.setOpacity) cls.prototype.set_opacity = cls.prototype.setOpacity;

                        // 1. Patch getX/Y/Z if missing (and getCenter is available)
                        if (cls.prototype.getCenter) {
                            if (!cls.prototype.getX) cls.prototype.getX = function () { return this.getCenter()[0]; };
                            if (!cls.prototype.getY) cls.prototype.getY = function () { return this.getCenter()[1]; };
                            if (!cls.prototype.getZ) cls.prototype.getZ = function () { return this.getCenter()[2]; };

                            // 2. Patch setX/Y/Z if missing (and shift is available)
                            if (cls.prototype.shift) {
                                if (!cls.prototype.setX) cls.prototype.setX = function (x) {
                                    const current = this.getCenter();
                                    return this.shift([x - current[0], 0, 0]);
                                };
                                if (!cls.prototype.setY) cls.prototype.setY = function (y) {
                                    const current = this.getCenter();
                                    return this.shift([0, y - current[1], 0]);
                                };
                                if (!cls.prototype.setZ) cls.prototype.setZ = function (z) {
                                    const current = this.getCenter();
                                    return this.shift([0, 0, z - current[2]]);
                                };
                            }
                        }

                        // 3. Patch moveTo if present
                        if (cls.prototype.moveTo && !cls.prototype.moveTo.__isPatched) {
                            const originalMoveTo = cls.prototype.moveTo;
                            cls.prototype.moveTo = function (pointOrMobject, ...args) {
                                let target = pointOrMobject;
                                let remainingArgs = args;

                                // 3a. Handle moveTo(Mobject) -> moveTo(Mobject.getCenter())
                                if (target && typeof target === 'object' && typeof target.getCenter === 'function') {
                                    try {
                                        target = target.getCenter();
                                    } catch (err) {
                                        console.warn(`ManimVisualizer: Failed to getCenter from target in moveTo on ${this.constructor.name}`, err);
                                        return this;
                                    }
                                }
                                // 3b. Handle moveTo(x, y, z) -> moveTo([x, y, z])
                                else if (typeof target === 'number' && args.length >= 2) {
                                    target = [target, ...args];
                                    remainingArgs = [];
                                }

                                // 3c. Robustness check
                                if (target && (typeof target[Symbol.iterator] !== 'function' || typeof target === 'string')) {
                                    console.warn(`ManimVisualizer: blocked invalid moveTo target on ${this.constructor.name}:`, target);
                                    return this;
                                }
                                if (!target) return this;

                                try {
                                    return originalMoveTo.call(this, target, ...remainingArgs);
                                } catch (err) {
                                    console.error(`ManimVisualizer: Error in originalMoveTo for ${this.constructor.name}:`, err);
                                    return this;
                                }
                            };
                            cls.prototype.moveTo.__isPatched = true;
                            if (cls.prototype.move_to) cls.prototype.move_to = cls.prototype.moveTo;
                        }

                        // 4. Polyfill moveBy / move_by (often hallucinated by AI or confused with shift)
                        if (!cls.prototype.moveBy && cls.prototype.shift) {
                            cls.prototype.moveBy = function (pointOrCoords, ...args) {
                                let vector = pointOrCoords;
                                if (typeof pointOrCoords === 'number') {
                                    vector = [pointOrCoords, ...args];
                                }
                                return this.shift(vector);
                            };
                            cls.prototype.move_by = cls.prototype.moveBy;
                        }

                        // 5. Polyfill Array Indexing (Mobject[1])
                        // Python allows indexing into submobjects via `mobj[i]`. In JS, we map this by defining getters.
                        for (let i = 0; i < 50; i++) {
                            if (!cls.prototype.hasOwnProperty(i)) {
                                Object.defineProperty(cls.prototype, i, {
                                    get: function () {
                                        return this.submobjects ? this.submobjects[i] : undefined;
                                    },
                                    configurable: true
                                });
                            }
                        }

                        // 6. Geometry convenience methods
                        if (!cls.prototype.getTop) {
                            cls.prototype.getTop = function () { return this.get_top ? this.get_top() : this.get_critical_point(UP); };
                            cls.prototype.get_top = cls.prototype.getTop;
                        }
                        if (!cls.prototype.getBottom) {
                            cls.prototype.getBottom = function () { return this.get_bottom ? this.get_bottom() : this.get_critical_point(DOWN); };
                            cls.prototype.get_bottom = cls.prototype.getBottom;
                        }
                        if (!cls.prototype.getLeft) {
                            cls.prototype.getLeft = function () { return this.get_left ? this.get_left() : this.get_critical_point(LEFT); };
                            cls.prototype.get_left = cls.prototype.getLeft;
                        }
                        if (!cls.prototype.getRight) {
                            cls.prototype.getRight = function () { return this.get_right ? this.get_right() : this.get_critical_point(RIGHT); };
                            cls.prototype.get_right = cls.prototype.getRight;
                        }

                        if (!cls.prototype.getCorner) {
                            cls.prototype.getCorner = function (vector) {
                                return this.get_critical_point ? this.get_critical_point(vector) : (this.getCorner ? this.getCorner(vector) : [0, 0, 0]);
                            };
                            cls.prototype.get_corner = cls.prototype.getCorner;
                        }

                        if (!cls.prototype.alignTo) {
                            cls.prototype.alignTo = function (target, edge = [0, 0, 0]) {
                                if (this.align_to) return this.align_to(target, edge);
                                // Basic alignment logic if missing
                                const targetPoint = (target && typeof target.get_critical_point === 'function') ? target.get_critical_point(edge) : target;
                                if (targetPoint && this.moveTo) {
                                    const selfPoint = this.get_critical_point ? this.get_critical_point(edge) : this.getCenter();
                                    const shiftVec = [targetPoint[0] - selfPoint[0], targetPoint[1] - selfPoint[1], targetPoint[2] - selfPoint[2]];
                                    return this.shift ? this.shift(shiftVec) : this;
                                }
                                return this;
                            };
                            cls.prototype.align_to = cls.prototype.alignTo;
                        }

                        // 7. State Management
                        const STATE_SYM = Symbol('saved_state');
                        if (!cls.prototype.saveState) {
                            cls.prototype.saveState = function () {
                                try { this[STATE_SYM] = this.copy(); } catch (e) { }
                                return this;
                            };
                            cls.prototype.save_state = cls.prototype.saveState;
                        }
                        if (!cls.prototype.restore) {
                            cls.prototype.restore = function () {
                                if (this[STATE_SYM] && typeof this.become === 'function') {
                                    this.become(this[STATE_SYM]);
                                }
                                return this;
                            };
                        }

                        // 8. No-op updaters (prevents crash if AI uses them)
                        if (!cls.prototype.addUpdater) {
                            cls.prototype.addUpdater = function (func) {
                                console.warn("ManimVisualizer: addUpdater is not fully supported and was ignored.");
                                return this;
                            };
                            cls.prototype.add_updater = cls.prototype.addUpdater;
                        }
                        if (!cls.prototype.removeUpdater) {
                            cls.prototype.removeUpdater = function () { return this; };
                            cls.prototype.remove_updater = cls.prototype.removeUpdater;
                        }
                        if (!cls.prototype.clearUpdaters) {
                            cls.prototype.clearUpdaters = function () { return this; };
                            cls.prototype.clear_updaters = cls.prototype.clearUpdaters;
                        }

                        // 9. Match Methods
                        if (!cls.prototype.matchWidth && cls.prototype.scale) {
                            cls.prototype.matchWidth = function (target) {
                                const targetW = target.get_width ? target.get_width() : (target.width || 0);
                                const selfW = this.get_width ? this.get_width() : (this.width || 1);
                                if (selfW !== 0) this.scale(targetW / selfW);
                                return this;
                            };
                            cls.prototype.match_width = cls.prototype.matchWidth;
                        }

                        // 10. set_z_index
                        if (!cls.prototype.setZIndex) {
                            cls.prototype.setZIndex = function (index) {
                                this.z_index = index; // manim-web uses z_index property
                                return this;
                            };
                            cls.prototype.set_z_index = cls.prototype.setZIndex;
                        }

                        // 11. center
                        if (!cls.prototype.center) {
                            cls.prototype.center = function () {
                                if (typeof this.moveTo === 'function') return this.moveTo([0, 0, 0]);
                                return this;
                            };
                        }

                        // 12. Patch add to be variadic (Manim standard)
                        if (cls.prototype.add && !cls.prototype.add.__isPatched) {
                            const originalAdd = cls.prototype.add;
                            cls.prototype.add = function (...mobjects) {
                                for (const m of mobjects) {
                                    if (!m) continue;
                                    if (Array.isArray(m)) {
                                        for (const sm of m) if (sm) originalAdd.call(this, sm);
                                    } else {
                                        originalAdd.call(this, m);
                                    }
                                }
                                return this;
                            };
                            cls.prototype.add.__isPatched = true;
                        }
                    };

                    // Apply Polyfills
                    polyfillPrototypes(classesToPolyfill);

                    // Apply patches to all classes
                    classesToPolyfill.forEach(cls => patchMobjectMethods(cls));
                    if (Manim.Mobject) patchMobjectMethods(Manim.Mobject);
                    if (Manim.VMobject) patchMobjectMethods(Manim.VMobject);

                    // Helper to patch VMobject point setting methods to avoid NaNs
                    const patchVMobjectPoints = (cls) => {
                        if (!cls || !cls.prototype) return;
                        if (cls.prototype.setPoints.__isPatched) return;

                        const methodsToSanitize = ['setPoints', 'setPointsAsCorners', 'addPoints'];

                        methodsToSanitize.forEach(methodName => {
                            if (typeof cls.prototype[methodName] === 'function') {
                                const originalMethod = cls.prototype[methodName];
                                cls.prototype[methodName] = function (points, ...args) {
                                    // Sanitize points
                                    if (Array.isArray(points)) {
                                        let hasNaN = false;
                                        for (let i = 0; i < points.length; i++) {
                                            const pt = points[i];
                                            if (Array.isArray(pt)) {
                                                for (let j = 0; j < pt.length; j++) {
                                                    if (isNaN(pt[j])) {
                                                        pt[j] = 0; // Replace NaN with 0
                                                        hasNaN = true;
                                                    }
                                                }
                                            }
                                        }
                                        if (hasNaN) {
                                            console.warn(`ManimVisualizer: Sanitized NaN points in ${this.constructor.name}.${methodName}`);
                                        }
                                    }
                                    return originalMethod.call(this, points, ...args);
                                };
                            }
                        });
                        cls.prototype.setPoints.__isPatched = true;
                    };

                    // Apply point sanitization to VMobject and subclasses
                    if (Manim.VMobject) patchVMobjectPoints(Manim.VMobject);
                    classesToPolyfill.forEach(cls => {
                        // naive check if it inherits from VMobject or has setPoints
                        if (cls.prototype.setPoints) patchVMobjectPoints(cls);
                    });

                    // Python-style range() polyfill
                    manimLib.range = (startOrStop, stop, step) => {
                        let s, e, st;
                        if (stop === undefined) { s = 0; e = startOrStop; st = 1; }
                        else { s = startOrStop; e = stop; st = step || (s <= e ? 1 : -1); }
                        const result = [];
                        if (st > 0) { for (let i = s; i < e; i += st) result.push(i); }
                        else { for (let i = s; i > e; i += st) result.push(i); }
                        return result;
                    };

                    // Add Custom Constants
                    manimLib.PI = Math.PI;
                    manimLib.TAU = 2 * Math.PI;
                    manimLib.DEGREES = Math.PI / 180;
                    manimLib.FRAME_HEIGHT = 8.0;
                    manimLib.FRAME_WIDTH = 14.222222222222221;
                    manimLib.ASPECT_RATIO = 16.0 / 9.0;

                    // Expand Colors
                    const extraColors = {
                        PURE_RED: "#FF0000", PURE_GREEN: "#00FF00", PURE_BLUE: "#0000FF",
                        GRAY_A: "#f4f4f4", GRAY_B: "#d9d9d9", GRAY_C: "#bfbfbf", GRAY_D: "#a6a6a6", GRAY_E: "#8c8c8c",
                        RED_A: "#f7cfcf", RED_B: "#f09f9f", RED_C: "#e87070", RED_D: "#e14040", RED_E: "#d91111",
                        BLUE_A: "#cfe2f3", BLUE_B: "#a2c4c9", BLUE_C: "#76a5af", BLUE_D: "#45818e", BLUE_E: "#134f5c",
                        GREY_A: "#f4f4f4", GREY_B: "#d9d9d9", GREY_C: "#bfbfbf", GREY_D: "#a6a6a6", GREY_E: "#8c8c8c",
                    };
                    Object.assign(manimLib, extraColors);

                    // Alias missing Transform classes to Transform
                    manimLib.TransformMatchingTex = manimLib.TransformMatchingTex || manimLib.Transform;
                    manimLib.TransformMatchingShapes = manimLib.TransformMatchingShapes || manimLib.Transform;

                    // Add RateFunctions Namespace (in case AI uses RateFunctions.linear)

                    // Expose common rate functions globally in manimLib (for direct access like rateFunc: linear)
                    manimLib.linear = manimLib.linear || ((t) => t);
                    manimLib.smooth = manimLib.smooth || ((t) => t * t * (3 - 2 * t));

                    // Numpy Aliases for AI expressions
                    manimLib.linspace = manimLib.linspace || ((start, stop, num) => {
                        const step = (stop - start) / (num - 1);
                        return Array.from({ length: num }, (_, i) => start + i * step);
                    });

                    manimLib.np = {
                        sin: Math.sin, cos: Math.cos, tan: Math.tan,
                        sqrt: Math.sqrt, exp: Math.exp, log: Math.log,
                        abs: Math.abs, ceil: Math.ceil, floor: Math.floor,
                        pi: Math.PI, e: Math.E,
                        array: (a) => a,
                        linspace: manimLib.linspace
                    };

                    // ---------------------------------------------------------
                    // POLYFILL: VGroup
                    // ---------------------------------------------------------

                    if (manimLib.VGroup && !manimLib.VGroup.__isPatchedConstructor) {
                        const origVGroup = manimLib.VGroup;
                        manimLib.VGroup = function (...args) {
                            let mobjects = args;
                            if (args.length === 1 && Array.isArray(args[0])) {
                                mobjects = args[0];
                            }
                            mobjects = mobjects.flat().filter(m => m != null);
                            return new origVGroup(...mobjects);
                        };
                        manimLib.VGroup.prototype = origVGroup.prototype;
                        manimLib.VGroup.__isPatchedConstructor = true;
                    }

                    // ---------------------------------------------------------
                    // POLYFILL: ApplyFunction & .animate
                    // ---------------------------------------------------------

                    // .animate polyfill (returns a Transform animation for method calls)
                    if (manimLib.Mobject && !manimLib.Mobject.prototype.animate) {
                        Object.defineProperty(manimLib.Mobject.prototype, 'animate', {
                            get: function () {
                                const original = this;
                                return new Proxy({}, {
                                    get: (target, prop) => (...args) => {
                                        if (typeof original[prop] !== 'function') {
                                            console.warn(`Method ${prop} not found on Mobject for .animate`);
                                            const anim = new manimLib.Wait(0.1);
                                            anim._targetMobject = original.copy ? original.copy() : original;
                                            return anim;
                                        }
                                        const copy = original.copy ? original.copy() : original;
                                        copy[prop](...args);

                                        // Create Transform
                                        if (manimLib.Transform) {
                                            const anim = new manimLib.Transform(original, copy);
                                            anim._targetMobject = copy; // Custom property for chaining and ApplyFunction
                                            return anim;
                                        }
                                        return new manimLib.Wait(1);
                                    }
                                });
                            }
                        });
                    }



                    // ApplyFunction Polyfill
                    // Handles: new ApplyFunction(func, mob)
                    if (!manimLib.ApplyFunction) {
                        manimLib.ApplyFunction = function (func, mobject, config = {}) {
                            try {
                                if (mobject && typeof mobject.copy === 'function') {
                                    const dummy = mobject.copy();
                                    const result = func(dummy);

                                    // If func returned an animation (from .animate)
                                    if (result && result._targetMobject) {
                                        return new manimLib.Transform(mobject, result._targetMobject, config);
                                    }

                                    // If func modified dummy in place
                                    if (manimLib.Transform) {
                                        return new manimLib.Transform(mobject, dummy, config);
                                    }
                                }

                                console.warn("ApplyFunction fallback: Could not determine target state");
                                return new manimLib.Wait(1);
                            } catch (err) {
                                console.error("ApplyFunction error:", err);
                                return new manimLib.Wait(1);
                            }
                        };
                    }


                    // ---------------------------------------------------------
                    // POLYFILL: Missing Methods (Hallucinations & Utilities)
                    // ---------------------------------------------------------

                    // waitForRender (Hallucination by AI) - No-op
                    if (manimLib.Mobject && !manimLib.Mobject.prototype.waitForRender) {
                        manimLib.Mobject.prototype.waitForRender = async function () {
                            return this;
                        };
                        manimLib.Mobject.prototype.wait_for_render = manimLib.Mobject.prototype.waitForRender;
                    }

                    // getGraph (for Axes)
                    // AI usage: axes.getGraph(x => Math.sin(x), { color: RED })
                    // We need to map this to plotting logic
                    const patchCoordinateSystem = (cls) => {
                        if (!cls || !cls.prototype) return;

                        if (!cls.prototype.getGraph) {
                            cls.prototype.getGraph = function (func, config = {}) {
                                // Use existing snake_case if available
                                if (this.get_graph) return this.get_graph(func, config);

                                // Fallback: Parametric Curve
                                try {
                                    const xRange = this.xRange || this.x_range || [-1, 1, 1];
                                    const xMin = xRange[0];
                                    const xMax = xRange[1];
                                    // Default step
                                    const step = (xMax - xMin) / 100;

                                    // We need to construct points [t, func(t), 0] and map them to coords?
                                    // Actually get_graph usually returns a FunctionGraph or ParametricFunction

                                    if (manimLib.FunctionGraph) {
                                        return new manimLib.FunctionGraph(func, { xRange: [xMin, xMax], ...config });
                                    }

                                    if (manimLib.ParametricFunction) {
                                        return new manimLib.ParametricFunction(
                                            (t) => [t, func(t), 0],
                                            { tRange: [xMin, xMax], ...config }
                                        );
                                    }
                                } catch (err) {
                                    console.warn("getGraph polyfill failed:", err);
                                }
                                return new manimLib.VMobject(); // Empty fallback
                            };
                            cls.prototype.get_graph = cls.prototype.getGraph;
                        }

                        // coordsToPoint mapping (coords_to_point)
                        if (!cls.prototype.coordsToPoint && cls.prototype.coords_to_point) {
                            cls.prototype.coordsToPoint = cls.prototype.coords_to_point;
                        }

                        // Shorthand for AI
                        if (!cls.prototype.c2p) cls.prototype.c2p = function (...args) { return this.coordsToPoint ? this.coordsToPoint(...args) : this.coords_to_point(...args); };
                        if (!cls.prototype.p2c) cls.prototype.p2c = function (...args) { return this.pointToCoords ? this.pointToCoords(...args) : this.point_to_coords(...args); };

                        if (!cls.prototype.getXAxisLabel) {
                            cls.prototype.getXAxisLabel = function (label, config = {}) {
                                if (this.get_x_axis_label) return this.get_x_axis_label(label, config);
                                const tex = new manimLib.MathTex({ latex: label, ...config });
                                try {
                                    const xMax = (this.x_range || this.xRange || [0, 10])[1];
                                    const pt = this.coordsToPoint(xMax, 0);
                                    tex.nextTo(pt, DOWN, { buff: 0.1 });
                                } catch (e) { }
                                return tex;
                            };
                            cls.prototype.get_x_axis_label = cls.prototype.getXAxisLabel;
                        }

                        if (!cls.prototype.getYAxisLabel) {
                            cls.prototype.getYAxisLabel = function (label, config = {}) {
                                if (this.get_y_axis_label) return this.get_y_axis_label(label, config);
                                const tex = new manimLib.MathTex({ latex: label, ...config });
                                try {
                                    const yMax = (this.y_range || this.yRange || [0, 10])[1];
                                    const pt = this.coordsToPoint(0, yMax);
                                    tex.nextTo(pt, LEFT, { buff: 0.1 });
                                } catch (e) { }
                                return tex;
                            };
                            cls.prototype.get_y_axis_label = cls.prototype.getYAxisLabel;
                        }
                    };

                    if (manimLib.CoordinateSystem) patchCoordinateSystem(manimLib.CoordinateSystem);
                    if (manimLib.Axes) patchCoordinateSystem(manimLib.Axes);
                    if (manimLib.NumberPlane) patchCoordinateSystem(manimLib.NumberPlane);

                    manimLib.RateFunctions = {
                        linear: manimLib.linear,
                        smooth: manimLib.smooth,
                        easeIn: manimLib.easeIn,
                        easeOut: manimLib.easeOut,
                        easeInOut: manimLib.easeInOut,
                        easeInQuad: manimLib.easeInQuad,
                        easeOutQuad: manimLib.easeOutQuad,
                        easeInExpo: manimLib.easeInExpo,
                        easeOutExpo: manimLib.easeOutExpo,
                        easeInBounce: manimLib.easeInBounce,
                        easeOutBounce: manimLib.easeOutBounce,
                        thereAndBack: manimLib.thereAndBack,
                        rushInto: manimLib.rushInto,
                        rushFrom: manimLib.rushFrom,
                        doubleSmooth: manimLib.doubleSmooth,
                        stepFunction: manimLib.stepFunction,
                        reverse: manimLib.reverse,
                        compose: manimLib.compose
                    };

                    // ---------------------------------------------------------
                    // POLYFILL: MathTex specifics
                    // ---------------------------------------------------------
                    if (manimLib.MathTex) {
                        const MT = manimLib.MathTex;
                        if (!MT.prototype.getPartByTex) {
                            MT.prototype.getPartByTex = function (tex) {
                                // manim-web MathTex is not a VGroup of parts, so we return a copy or self
                                // This is a best-effort polyfill.
                                console.warn(`MathTex.getPartByTex('${tex}') is not fully supported. Returning self.`);
                                return this;
                            };
                            MT.prototype.get_part_by_tex = MT.prototype.getPartByTex;
                        }
                        if (!MT.prototype.setColorByTex) {
                            MT.prototype.setColorByTex = function (tex, color) {
                                // No-op but prevent crash
                                console.warn(`MathTex.setColorByTex('${tex}', '${color}') is not supported.`);
                                return this;
                            };
                            MT.prototype.set_color_by_tex = MT.prototype.setColorByTex;
                        }
                        if (!MT.prototype.setColorByTexToColorMap) {
                            MT.prototype.setColorByTexToColorMap = function (map) {
                                return this;
                            };
                            MT.prototype.set_color_by_tex_to_color_map = MT.prototype.setColorByTexToColorMap;
                        }
                    }

                    // --- 5. Dynamic Script Execution ---
                    // Pre-process: fix vector math that JS can't handle natively
                    // Handles: vecFunc(...) * scalar, scalar * vecFunc(...),
                    //          obj.method(...) * scalar, obj.method(...) + expr, etc.
                    const fixVectorMath = (code) => {
                        // Known standalone vector functions
                        const vecFuncs = ['addVectors', 'subVectors', 'subtractVectors', 'scaleVec', 'multVector'];
                        // Known methods that return vectors (on Mobject/VMobject)
                        const vecMethods = [
                            'getCenter', 'get_center', 'getStart', 'get_start', 'getEnd', 'get_end',
                            'getVector', 'get_vector', 'getLeft', 'get_left', 'getRight', 'get_right',
                            'getTop', 'get_top', 'getBottom', 'get_bottom',
                            'pointFromProportion', 'point_from_proportion',
                        ];
                        let fixed = code;

                        // Helper: find matching close paren
                        const findCloseParen = (str, startIdx) => {
                            let depth = 0;
                            for (let i = startIdx; i < str.length; i++) {
                                if (str[i] === '(') depth++;
                                else if (str[i] === ')') { depth--; if (depth === 0) return i; }
                            }
                            return -1;
                        };

                        // Helper: scan backwards to find start of a chained expression
                        const findExprStart = (str, idx) => {
                            let i = idx - 1;
                            while (i >= 0) {
                                const c = str[i];
                                if (/[a-zA-Z0-9_$.]/.test(c)) { i--; }
                                else if (c === ')') {
                                    let d = 1; i--;
                                    while (i >= 0 && d > 0) { if (str[i] === ')') d++; else if (str[i] === '(') d--; i--; }
                                } else if (c === ']') {
                                    let d = 1; i--;
                                    while (i >= 0 && d > 0) { if (str[i] === ']') d++; else if (str[i] === '[') d--; i--; }
                                } else { break; }
                            }
                            return i + 1;
                        };

                        // Helper: find end of a scalar/vector expression
                        const findExprEnd = (str, startIdx) => {
                            let end = startIdx; let depth = 0;
                            for (let i = startIdx; i < str.length; i++) {
                                const c = str[i];
                                if (c === '(' || c === '[') depth++;
                                else if (c === ')' || c === ']') { if (depth === 0) break; depth--; }
                                else if (depth === 0 && (c === ',' || c === ';' || c === '\n' || c === '}')) break;
                                // Stop at + or - that aren't inside parens (for addVectors)
                                else if (depth === 0 && (c === '+') && i > startIdx) break;
                                end = i + 1;
                            }
                            return end;
                        };

                        // Pass 1: vecFunc(...) * scalar  â†’  multVector(vecFunc(...), scalar)
                        vecFuncs.forEach(fn => {
                            let s = 0;
                            while (true) {
                                const idx = fixed.indexOf(fn + '(', s);
                                if (idx === -1) break;
                                if (idx > 0 && /[a-zA-Z0-9_$]/.test(fixed[idx - 1])) { s = idx + 1; continue; }
                                const closeIdx = findCloseParen(fixed, idx + fn.length);
                                if (closeIdx === -1) { s = idx + 1; continue; }
                                const after = fixed.substring(closeIdx + 1);
                                const mulMatch = after.match(/^\s*\*/);
                                if (mulMatch) {
                                    const mulStart = closeIdx + 1 + mulMatch[0].length;
                                    const mulEnd = findExprEnd(fixed, mulStart);
                                    const mult = fixed.substring(mulStart, mulEnd).trim();
                                    if (mult) {
                                        const vecCall = fixed.substring(idx, closeIdx + 1);
                                        const rep = `multVector(${vecCall}, ${mult})`;
                                        fixed = fixed.substring(0, idx) + rep + fixed.substring(mulEnd);
                                        s = idx + rep.length;
                                    } else { s = closeIdx + 1; }
                                } else { s = closeIdx + 1; }
                            }
                        });

                        // Pass 2: obj.vecMethod(...) [*+-] expr
                        vecMethods.forEach(method => {
                            let s = 0;
                            while (true) {
                                const dotIdx = fixed.indexOf('.' + method + '(', s);
                                if (dotIdx === -1) break;
                                const parenStart = dotIdx + 1 + method.length;
                                const closeIdx = findCloseParen(fixed, parenStart);
                                if (closeIdx === -1) { s = dotIdx + 1; continue; }
                                const exprStart = findExprStart(fixed, dotIdx);
                                const fullExpr = fixed.substring(exprStart, closeIdx + 1);
                                const after = fixed.substring(closeIdx + 1);
                                const opMatch = after.match(/^\s*([+\-*])\s*/);
                                if (opMatch) {
                                    const op = opMatch[1];
                                    const rhsStart = closeIdx + 1 + opMatch[0].length;
                                    const rhsEnd = findExprEnd(fixed, rhsStart);
                                    const rhs = fixed.substring(rhsStart, rhsEnd).trim();
                                    if (rhs) {
                                        let rep;
                                        if (op === '*') rep = `multVector(${fullExpr}, ${rhs})`;
                                        else if (op === '+') rep = `addVectors(${fullExpr}, ${rhs})`;
                                        else if (op === '-') rep = `subVectors(${fullExpr}, ${rhs})`;
                                        if (rep) {
                                            fixed = fixed.substring(0, exprStart) + rep + fixed.substring(rhsEnd);
                                            s = exprStart + rep.length;
                                            continue;
                                        }
                                    }
                                }
                                s = closeIdx + 1;
                            }
                        });

                        return fixed;
                    };

                    const originalCode = codeToRun;
                    codeToRun = fixVectorMath(codeToRun);
                    if (originalCode !== codeToRun) {
                        console.log('ManimVisualizer: Vector math pre-processed:', codeToRun);
                    }



                    // Pre-process: fix LaTeX escape sequences in string literals
                    // The AI generates: new MathTex({ latex: "d\vec{l}" })
                    // In JS strings, \v is a vertical tab, \f is form feed, etc.
                    // We need to double-escape backslashes BEFORE new Function() parses the code
                    // At this point, codeToRun is source text: the \v is literally backslash + v (2 chars)
                    const fixLatexEscapes = (code) => {
                        let fixed = code;
                        // Match string literals (single or double quoted) and fix LaTeX backslashes inside them
                        // We look for strings that likely contain LaTeX (have { } or ^ _ patterns)
                        fixed = fixed.replace(/(["'])((?:[^"'\\]|\\.)*)(\1)/g, (fullMatch, openQuote, content, closeQuote) => {
                            // Only fix strings that look like LaTeX (contain braces, subscripts, superscripts)
                            const looksLikeLatex = content.includes('{') || content.includes('_') ||
                                content.includes('^') || /\\[a-zA-Z]/.test(content);
                            if (!looksLikeLatex) return fullMatch;

                            // In the source text, \v is two characters: \ and v
                            // We need to turn \v into \\v (so new Function() sees \\v → literal \v in the string)
                            // But DON'T touch already-escaped \\v (which is \ \ v in source → correct)
                            let fixedContent = content;

                            // Replace single-backslash + letter with double-backslash + letter
                            // (?<!\\) ensures we don't double-escape already-escaped \\vec
                            // This catches \v, \f, \b, \n, \r, \t, \a and ALL other \letter sequences
                            // which are LaTeX commands like \vec, \frac, \mathbf, \alpha, etc.
                            fixedContent = fixedContent.replace(/(?<!\\)\\([a-zA-Z])/g, '\\\\$1');

                            if (fixedContent !== content) {
                                return openQuote + fixedContent + closeQuote;
                            }
                            return fullMatch;
                        });
                        return fixed;
                    };

                    const beforeLatexFix = codeToRun;
                    codeToRun = fixLatexEscapes(codeToRun);
                    if (beforeLatexFix !== codeToRun) {
                        console.log('ManimVisualizer: LaTeX escapes fixed in code strings');
                    }

                    // Pre-process: fix Python f-strings in JS template literals
                    // AI generates: `${period:.1f}` which is invalid JS.
                    // We need to convert it to `${period.toFixed(1)}`
                    const fixFStrings = (code) => {
                        let fixed = code;
                        // Regex for ${variable:.Nf}
                        // Matches: ${  (captured group 1: variable expression)  :  .  (captured group 2: digits)  f  }
                        // We use a non-greedy match for the variable part to handle simple cases
                        // Note: this might struggle with nested braces, but for simple variable formatting it works.
                        fixed = fixed.replace(/\$\{([^:}]+):\.(\d+)f\}/g, (match, expr, digits) => {
                            return `\${(${expr}).toFixed(${digits})}`;
                        });
                        return fixed;
                    };

                    const beforeFStringFix = codeToRun;
                    codeToRun = fixFStrings(codeToRun);
                    if (beforeFStringFix !== codeToRun) {
                        console.log('ManimVisualizer: Python f-strings fixed:', codeToRun);
                    }

                    // Pre-process: fix Python syntax remnants that the AI transpiler misses
                    const fixPythonSyntax = (code) => {
                        let fixed = code;

                        // Strip out "class MyScene(Scene):" and "def construct(self):"
                        // These cause SyntaxErrors in JS if the AI included them.
                        fixed = fixed.replace(/class\s+[a-zA-Z_]\w*\s*\([^)]*\)\s*:/g, '');
                        fixed = fixed.replace(/def\s+construct\s*\([^)]*\)\s*:/g, '');

                        // Fix "lambda x, y:" → "(x, y) =>" and "lambda x:" → "(x) =>" and "lambda:" → "() =>"
                        fixed = fixed.replace(/\blambda\s+([a-zA-Z_]\w*(?:\s*,\s*[a-zA-Z_]\w*)*)\s*:/g, '($1) =>');
                        fixed = fixed.replace(/\blambda\s*:/g, '() =>');

                        // Fix Python "not " → "!" (only standalone, not "not in" or "cannot")
                        // Be careful: only replace "not " when it's a standalone boolean operator
                        fixed = fixed.replace(/\bnot\s+(?!in\b)/g, '!');

                        // Fix Python "and" → "&&", "or" → "||"  
                        fixed = fixed.replace(/\band\b/g, '&&');
                        fixed = fixed.replace(/\bor\b/g, '||');

                        // Fix Python "True" / "False" / "None"
                        fixed = fixed.replace(/\bTrue\b/g, 'true');
                        fixed = fixed.replace(/\bFalse\b/g, 'false');
                        fixed = fixed.replace(/\bNone\b/g, 'null');

                        return fixed;
                    };

                    const beforePythonFix = codeToRun;
                    codeToRun = fixPythonSyntax(codeToRun);
                    if (beforePythonFix !== codeToRun) {
                        console.log('ManimVisualizer: Python syntax fixed:', codeToRun);
                    }

                    // Pre-process: fix mismatched brackets from AI code generation
                    // AI often generates `[-3, -2, -1, 0, 1, 2, 3, 4).map(...)` (opens [ closes ))
                    const fixBracketMismatches = (code) => {
                        let fixed = code;
                        // Fix `[...)` → `[...]`: Find [ not followed by matching ], but followed by )
                        // Strategy: for each `[`, find its closing bracket. If it's `)`, replace with `]`
                        const chars = fixed.split('');
                        const stack = [];
                        for (let i = 0; i < chars.length; i++) {
                            if (chars[i] === '[' || chars[i] === '(') {
                                stack.push({ char: chars[i], idx: i });
                            } else if (chars[i] === ']' || chars[i] === ')') {
                                if (stack.length > 0) {
                                    const open = stack[stack.length - 1];
                                    if (open.char === '[' && chars[i] === ')') {
                                        chars[i] = ']'; // Fix mismatch
                                        console.warn(`ManimVisualizer: Fixed bracket mismatch at position ${i}: ) → ]`);
                                    } else if (open.char === '(' && chars[i] === ']') {
                                        chars[i] = ')'; // Fix mismatch
                                        console.warn(`ManimVisualizer: Fixed bracket mismatch at position ${i}: ] → )`);
                                    }
                                    stack.pop();
                                }
                            }
                        }
                        return chars.join('');
                    };

                    const beforeBracketFix = codeToRun;
                    codeToRun = fixBracketMismatches(codeToRun);
                    if (beforeBracketFix !== codeToRun) {
                        console.log('ManimVisualizer: Bracket mismatches fixed');
                    }

                    // Pre-process: fix missing `const` on re-assigned variables
                    // AI sometimes declares `const waveInc = ...` then re-uses `waveInc = ...` in a loop
                    const fixMissingVarDecls = (code) => {
                        let fixed = code;
                        // Find variables declared with const/let, then fix bare reassignments
                        const declaredVars = new Set();
                        const declRegex = /(?:const|let|var)\s+([a-zA-Z_]\w*)\s*=/g;
                        let m;
                        while ((m = declRegex.exec(fixed)) !== null) {
                            declaredVars.add(m[1]);
                        }
                        // For each declared var, ensure later bare assignments use `const` or are valid
                        // Actually, the common case is: `const x = ...` in one loop iteration, then
                        // `x = ...` in the next. Fix by replacing bare `x = new ...` with `const x = new ...`
                        // only if x was previously declared with const (which would be an error)
                        // Simpler: just change the original `const` to `let` if there are later reassignments
                        for (const v of declaredVars) {
                            const reassignRegex = new RegExp(`(?<!const\\s)(?<!let\\s)(?<!var\\s)\\b${v}\\s*=\\s*new\\s`, 'g');
                            if (reassignRegex.test(fixed)) {
                                // Change the original const to let
                                fixed = fixed.replace(new RegExp(`\\bconst\\s+(${v})\\s*=`), 'let $1 =');
                            }
                        }
                        return fixed;
                    };

                    codeToRun = fixMissingVarDecls(codeToRun);

                    // Pre-process: fix unsupported Manim methods
                    // AI sometimes uses .getRandomPoint() which doesn't exist in manim-web
                    codeToRun = codeToRun.replace(/\.getRandomPoint\(\)/g, '.getCenter()');

                    // Pre-process: fix .points[N] access patterns
                    // Python Manim uses .points as a list of [x,y,z] coords;
                    // manim-web uses getStart()/getEnd()/getPoints() instead
                    codeToRun = codeToRun.replace(/\.points\[0\]/g, '.getStart()');
                    codeToRun = codeToRun.replace(/\.points\[-1\]/g, '.getEnd()');
                    // Generic .points[N] → .getPointAtPct(N/totalPoints) fallback
                    // For safety, replace .points with a helper that returns array-of-arrays
                    codeToRun = codeToRun.replace(/\.points\b(?!\s*=)/g, '.getPoints()');

                    // Generate destructuring string: "const { Scene, Mobject, ... } = manim;"
                    const destructuringKeys = Object.keys(manimLib).join(', ');
                    const destructuringStmt = `const { ${destructuringKeys} } = manim;`;

                    console.log("ManimVisualizer evaluating code:", codeToRun);

                    const userFunction = new Function('scene', 'manim', `
                        return (async () => {
                            // Destructure EVERYTHING from manimLib into local scope
                            ${destructuringStmt}
                            let time = 0; // Define time for AI generated code compatibility
                            const self = scene; // Map Python self.play() to JS scene.play()
                            
                            try {
                                ${codeToRun}
                            } catch (err) {
                                throw err;
                            }
                        })();
                    `);

                    await userFunction(scene, manimLib);

                } catch (err) {
                    console.error("Manim execution error:", err);
                    setError(err.message);
                }
            };

            runScene();
        }

        return () => {
            isMounted = false;
            if (rAFRef.current) {
                cancelAnimationFrame(rAFRef.current);
            }
            if (sceneRef.current) {
                try {
                    sceneRef.current._renderStopped = true;
                    const renderer = sceneRef.current.renderer || sceneRef.current._renderer;
                    if (renderer && renderer.dispose) {
                        renderer.dispose();
                        const gl = renderer.getContext && renderer.getContext();
                        if (gl) {
                            const loseContext = gl.getExtension('WEBGL_lose_context');
                            if (loseContext) loseContext.loseContext();
                        }
                    }
                } catch (e) {
                    console.warn("Error disposing Manim scene:", e);
                }
                sceneRef.current = null;
            }
        };
    }, [scriptContent]);

    if (!scriptContent) return <div style={{ color: '#666', padding: '20px', textAlign: 'center' }}>No script content</div>;

    return (
        <div className="manim-container" style={{
            width: '100%', height: '100%', minHeight: '400px', background: '#000',
            borderRadius: '12px', overflow: 'hidden', position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <style>{`
                .manim-container canvas {
                    max-width: 100% !important;
                    max-height: 100% !important;
                    width: auto !important;
                    height: auto !important;
                    outline: none;
                }
            `}</style>
            {error && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.95)', color: '#94a3b8',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    zIndex: 10, fontSize: '0.85rem', gap: '8px', padding: '20px', textAlign: 'center'
                }}>
                    <span style={{ fontSize: '2rem' }}>🎬</span>
                    <span style={{ color: '#e2e8f0', fontWeight: 500 }}>Animation couldn't render</span>
                    <span style={{ maxWidth: '300px', lineHeight: 1.4, opacity: 0.7 }}>This visualization had a code issue. The lesson content is still available below.</span>
                </div>
            )}
            <div ref={containerRef} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />

            {/* Progress Bar Overlay */}
            <div style={{
                position: 'absolute',
                bottom: '15px',
                right: '15px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(4px)',
                padding: '6px 12px',
                borderRadius: '20px',
                fontFamily: 'monospace',
                color: 'white',
                fontSize: '0.85rem',
                border: '1px solid rgba(255,255,255,0.1)',
                zIndex: 20
            }}>
                <svg width="24" height="24" viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
                    <circle
                        ref={progressCircleRef}
                        cx="20" cy="20" r="16" fill="none" stroke="white" strokeWidth="3"
                        strokeDasharray="100.53" strokeDashoffset="100.53"
                        strokeLinecap="round"
                        transform="rotate(-90 20 20)"
                        style={{ transition: 'stroke-dashoffset 0.1s linear' }}
                    />
                </svg>
                <span ref={progressTextRef}>0.0s / 0.0s</span>
            </div>
        </div>
    );
};

export default ManimVisualizer;

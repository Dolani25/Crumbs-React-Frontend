export const dummyLessons = {
  1: { // React Development
    1: {
      title: "30 Days of React",
      lessonNumber: "Lesson 03",
      topic: "First Components",
      content: {
        text: [
          "Components are the building blocks of React applications.",
          "A component can be either functional or class-based. Functional components are preferred in modern React.",
          "They accept inputs called 'props' and return React elements describing what should appear on the screen."
        ],
        code: `function Welcome(props) {
  return <h1>Hello, {props.name}</h1>;
}`,
        media: {
          image: "https://picsum.photos/seed/react1/600/400",
        }
      }
    },
    2: {
      title: "React Fundamentals",
      lessonNumber: "Lesson 04",
      topic: "Props and State",
      content: {
        text: [
          "Props (short for properties) are read-only components. They must be kept pure and not modified.",
          "State is similar to props, but it is private and fully controlled by the component.",
          "Use the useState hook to add state variables to functional components."
        ],
        code: `import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}`,
        media: {
          image: "https://picsum.photos/seed/react2/600/400"
        }
      }
    }
  },
  2: { // Advanced JavaScript
    1: {
      title: "Advanced JS",
      lessonNumber: "Lesson 01",
      topic: "Closures",
      content: {
        text: [
          "A closure is the combination of a function bundled together (enclosed) with references to its surrounding state (the lexical environment).",
          "In other words, a closure gives you access to an outer function's scope from an inner function.",
          "In JavaScript, closures are created every time a function is created, at function creation time."
        ],
        code: `function makeFunc() {
  const name = 'Mozilla';
  function displayName() {
    console.log(name);
  }
  return displayName;
}

const myFunc = makeFunc();
myFunc();`,
        media: {
          image: "https://picsum.photos/seed/js1/600/400"
        }
      }
    },
    2: {
      title: "Advanced JS",
      lessonNumber: "Lesson 02",
      topic: "Promises & Async/Await",
      content: {
        text: [
          "The Promise object represents the eventual completion (or failure) of an asynchronous operation and its resulting value.",
          "async/await is syntactic sugar built on top of Promises. It allows you to write asynchronous code that looks and behaves a little more like synchronous code."
        ],
        code: `async function fetchUser() {
  try {
    const response = await fetch('https://api.example.com/user');
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}`,
        media: {
          image: "https://picsum.photos/seed/js2/600/400"
        }
      }
    }
  },
  3: { // UI/UX Design
    1: {
      title: "UI/UX Fundamentals",
      lessonNumber: "Lesson 01",
      topic: "Design Thinking",
      content: {
        text: [
          "Design thinking is a non-linear, iterative process that teams use to understand users, challenge assumptions, redefine problems and create innovative solutions to prototype and test.",
          "It involves five phases: Empathize, Define, Ideate, Prototype, and Test."
        ],
        media: {
          image: "https://picsum.photos/seed/design1/600/400"
        }
      }
    },
    2: {
      title: "UI/UX Fundamentals",
      lessonNumber: "Lesson 02",
      topic: "Color Theory",
      content: {
        text: [
          "Color theory is the collection of rules and guidelines which designers use to communicate with users through appealing color schemes in visual interfaces.",
          "Key concepts include the color wheel, color harmony, and the psychological effects of different colors."
        ],
        media: {
          image: "https://picsum.photos/seed/design2/600/400"
        }
      }
    }
  },
  4: { // Chemistry (Existing)
    1: {
      title: "Introduction to Chemistry",
      lessonNumber: "Lesson 01",
      topic: "Atomic Structure",
      content: {
        text: [
          "Chemistry is the study of matter and the changes it undergoes.",
          "Atoms are the basic building blocks of all matter. Each atom consists of a nucleus containing protons and neutrons, with electrons orbiting around it.",
          "The number of protons determines the element's identity, while the number of electrons determines its chemical properties.",
          "Electrons are arranged in energy levels or shells around the nucleus. The outermost shell, known as the valence shell, is crucial for chemical bonding."
        ],
        code: `// Chemical Formula Parser
function parseFormula(formula) {
  const elements = formula.match(/[A-Z][a-z]?\\d*/g);
  return elements.map(el => ({
    element: el.match(/[A-Z][a-z]?/)[0],
    count: parseInt(el.match(/\\d+/) || '1')
  }));
}

// Example: H2O
console.log(parseFormula("H2O"));
// Output: [{element: "H", count: 2}, {element: "O", count: 1}]`,
        media: {
          image: "https://picsum.photos/seed/chem1/600/400"
        }
      },
      tool: {
        type: 'molecule-viewer',
        data: 'water'
      }
    },
    2: {
      title: "Chemical Bonding",
      lessonNumber: "Lesson 02",
      topic: "Ionic and Covalent Bonds",
      content: {
        text: [
          "Chemical bonds are forces that hold atoms together in molecules and compounds.",
          "Ionic bonds form when one atom transfers electrons to another atom, creating positively and negatively charged ions that attract each other.",
          "Covalent bonds form when atoms share electrons to achieve stable electron configurations.",
          "The type of bond formed depends on the difference in electronegativity between the atoms involved."
        ],
        code: `// Calculate Bond Type
function determineBondType(electronegativity1, electronegativity2) {
  const difference = Math.abs(electronegativity1 - electronegativity2);
  
  if (difference < 0.4) {
    return "Nonpolar Covalent";
  } else if (difference < 1.7) {
    return "Polar Covalent";
  } else {
    return "Ionic";
  }
}

// Example: NaCl (Sodium Chloride)
console.log(determineBondType(0.9, 3.0)); // Ionic
// Example: H2O (Water)
console.log(determineBondType(2.1, 3.5)); // Polar Covalent`,
        media: {
          image: "https://picsum.photos/seed/chem2/600/400"
        }
      }
    },
    3: {
      title: "Chemical Reactions",
      lessonNumber: "Lesson 03",
      topic: "Balancing Equations",
      content: {
        text: [
          "Chemical reactions involve the rearrangement of atoms to form new substances.",
          "The law of conservation of mass states that matter cannot be created or destroyed in a chemical reaction.",
          "To balance a chemical equation, ensure that the number of atoms of each element is the same on both sides.",
          "Balanced equations show the stoichiometric relationships between reactants and products."
        ],
        code: `// Chemical Equation Balancer
function balanceEquation(reactants, products) {
  // Simplified balancing algorithm
  const elements = new Set();
  
  // Collect all elements
  [...reactants, ...products].forEach(compound => {
    const matches = compound.match(/[A-Z][a-z]?/g);
    matches.forEach(el => elements.add(el));
  });
  
  return {
    elements: Array.from(elements),
    message: "Use coefficients to balance each element"
  };
}

// Example: 2H2 + O2 → 2H2O
console.log(balanceEquation(["H2", "O2"], ["H2O"]));`,
        media: {
          image: "https://picsum.photos/seed/chem3/600/400"
        }
      }
    },
    4: {
      title: "3D Molecular Visualization",
      lessonNumber: "Lesson 04",
      topic: "Interactive Molecular Structures",
      content: {
        text: [
          "Understanding molecular geometry is crucial for predicting chemical behavior and properties.",
          "Molecules exist in three-dimensional space, and their shape determines how they interact with other molecules.",
          "The 3D Molecular Viewer below allows you to explore various molecular structures interactively.",
          "You can rotate, zoom, and examine different compounds to understand their spatial arrangement and bonding patterns.",
          "Try selecting different molecules from the dropdown menu to explore various chemical structures, from simple molecules like water to complex compounds like caffeine and TCDD."
        ],
        code: `// Molecular Geometry Calculator
function getMolecularGeometry(centralAtom, electronPairs) {
  // VSEPR theory predictions
  if (electronPairs === 2) return "Linear";
  if (electronPairs === 3) return "Trigonal Planar";
  if (electronPairs === 4) return "Tetrahedral";
  if (electronPairs === 5) return "Trigonal Bipyramidal";
  if (electronPairs === 6) return "Octahedral";
  return "Unknown";
}

// Example: Water has 2 bonding pairs + 2 lone pairs = 4 electron pairs
console.log(getMolecularGeometry("O", 4)); // Bent molecular shape
console.log(getMolecularGeometry("C", 4)); // Tetrahedral (methane)
`,
        media: {
          image: "https://picsum.photos/seed/chem4/600/400"
        }
      }
    }
  },
  5: { // Advanced Mathematics
    1: {
      title: "Advanced Mathematics",
      lessonNumber: "Lesson 01",
      topic: "Quadratic Functions",
      content: {
        text: [
          "A quadratic function is a polynomial function with one or more variables in which the highest-degree term is of the second degree.",
          "The standard form of a quadratic equation is ax² + bx + c = 0.",
          "The graph of a quadratic function is a curve called a parabola.",
          "Use the interactive graph below to explore how changing the equation affects the parabola."
        ],
        code: `function solveQuadratic(a, b, c) {
  const discriminant = b * b - 4 * a * c;
  if (discriminant > 0) {
      const root1 = (-b + Math.sqrt(discriminant)) / (2 * a);
      const root2 = (-b - Math.sqrt(discriminant)) / (2 * a);
      return [root1, root2];
  } else if (discriminant === 0) {
      return [-b / (2 * a)];
  } else {
      return []; // Complex roots
  }
}`,
        media: { image: "https://picsum.photos/seed/math1/600/400" }
      },
      tool: {
        type: 'desmos-grapher',
        data: 'y=x^2',
        title: 'Parabola Explorer'
      }
    },
    2: {
      title: "Advanced Mathematics",
      lessonNumber: "Lesson 02",
      topic: "Trigonometry",
      content: {
        text: [
          "Trigonometry studies relationships between side lengths and angles of triangles.",
          "The sine and cosine functions are fundamental to describing periodic phenomena like sound and light waves.",
          "Explore the sine wave below. Notice its periodic nature."
        ],
        media: { image: "https://picsum.photos/seed/math2/600/400" }
      },
      tool: {
        type: 'desmos-grapher',
        data: 'y=\\sin(x)',
        title: 'Sine Wave Visualization'
      }
    },
    3: {
      title: "Advanced Mathematics",
      lessonNumber: "Lesson 03",
      topic: "Exponential Growth",
      content: {
        text: [
          "Exponential growth occurs when the growth rate of the value of a mathematical function is proportional to the function's current value.",
          "It is often written as y = a * b^x.",
          "This describes processes like compound interest, population growth, and viral spread."
        ],
        media: { image: "https://picsum.photos/seed/math3/600/400" }
      },
      tool: {
        type: 'desmos-grapher',
        data: 'y=2^x',
        title: 'Exponential Curve'
      }
    }
  },
  5: { // Petroleum Engineering
    1: {
      title: "History of the Oil & Gas Industry",
      lessonNumber: "Module 1",
      topic: "Ancient to Modern Era",
      content: {
        text: [
          `<h3>Lesson 1: Ancient Beginnings (Pre-1800s)</h3>
           <p>Before modern drilling, humanity relied on oil that naturally bubbled to the surface.</p>
           <ul>
             <li><b>Surface Seeps:</b> Ancient civilizations (Babylonians, Sumerians) used bitumen/asphalt from natural surface seeps to waterproof boats (caulking), construct walls, and even for medicinal purposes.</li>
             <li><b>The Chinese Bamboo Rigs:</b> As early as 347 AD, oil wells were drilled in China using bamboo poles to depths of up to 800 feet, primarily to extract salt brine (with oil/gas as a byproduct used for heating).</li>
             <li><b>Kerosene's Debut:</b> In the 1850s, Ignacy Łukasiewicz (Poland) and Abraham Gesner (Canada) discovered how to distill kerosene from petroleum/coal, providing a cleaner, cheaper alternative to whale oil for lamps.</li>
           </ul>`,

          `<h3>Lesson 2: The Birth of the Modern Industry (1859)</h3>
           <p>The industry "officially" began in the United States when "rock oil" became a commercial commodity.</p>
           <ul>
             <li><b>Colonel Edwin Drake:</b> In 1859, Drake drilled the first commercial oil well in Titusville, Pennsylvania.</li>
             <li><b>The Significance:</b> He used a steam engine and iron pipe to prevent borehole collapse. This proved oil could be extracted in large quantities.</li>
             <li><b>The Market:</b> At this time, the primary product was Kerosene for lighting. Gasoline was considered a useless byproduct and often discarded.</li>
           </ul>`,

          `<h3>Lesson 3: Spindletop & The Fuel Era (1901)</h3>
           <p>The focus shifted from "illumination" (lamps) to "transportation" (fuel) at the turn of the century.</p>
           <ul>
             <li><b>The Lucas Gusher:</b> In 1901, the Spindletop geyser in Beaumont, Texas, erupted, spewing 100,000 barrels a day. It was the first major "gusher."</li>
             <li><b>The Shift:</b> This mass production coincided with the rise of the internal combustion engine and the automobile (Henry Ford), creating a massive demand for gasoline.</li>
           </ul>`,

          `<h3>Lesson 4: The Rise of the Majors & "The Seven Sisters"</h3>
           <p>The early 20th century was defined by corporate consolidation and the race for global reserves.</p>
           <ul>
             <li><b>Standard Oil:</b> Founded by John D. Rockefeller, it controlled 90% of US refining until the Supreme Court broke it up in 1911 (creating companies like Exxon, Mobil, Chevron).</li>
             <li><b>The Seven Sisters:</b> For much of the mid-20th century, the global oil market was dominated by seven Western companies (including BP, Shell, Gulf, Texaco, and the Standard Oil offshoots). They controlled prices and production technology.</li>
           </ul>`,

          `<h3>Lesson 5: The Geopolitics of Oil (OPEC)</h3>
           <p>Power shifted from Western corporations to resource-rich nations in the 1960s and 70s.</p>
           <ul>
             <li><b>Formation of OPEC:</b> The Organization of the Petroleum Exporting Countries was founded in 1960 (Baghdad) by Iran, Iraq, Kuwait, Saudi Arabia, and Venezuela to regain control over their natural resources.</li>
             <li><b>Nationalization:</b> Many countries nationalized their oil industries, creating National Oil Companies (NOCs) like Saudi Aramco and NNPC.</li>
             <li><b>The 1973 Crisis:</b> OPEC imposed an embargo, causing oil prices to quadruple and proving that oil was a powerful political weapon.</li>
           </ul>`,

          `<h3>Lesson 6: The Nigerian Context (Local History)</h3>
           <p>For a student in Nigeria, these dates are critical for exams.</p>
           <ul>
             <li><b>1908:</b> The first search for oil began with the German Bitumen Corporation.</li>
             <li><b>1938:</b> Shell D'Arcy was granted the sole concession to explore for oil in Nigeria.</li>
             <li><b>1956:</b> The first commercial discovery was made at Oloibiri in Bayelsa State.</li>
             <li><b>1958:</b> Nigeria exported its first shipment of crude oil.</li>
           </ul>`,

          `<h3>Lesson 7: The Modern Era (Technology & Unconventional)</h3>
           <p>The current era is defined by going to harder-to-reach places.</p>
           <ul>
             <li><b>Offshore & Deepwater:</b> Moving from land to shallow water, and eventually to deepwater frontiers (like the Gulf of Guinea).</li>
             <li><b>The Shale Revolution:</b> The combination of horizontal drilling and hydraulic fracturing (fracking) allowed the extraction of oil and gas from tight rock formations, notably in the US.</li>
           </ul>`
        ],
        media: {
          image: "https://picsum.photos/seed/oilhistory/600/400"
        }
      },
      tool: {
        type: 'historical-map',
        title: "Evolution of Oil Production"
      }
    }
  }
};
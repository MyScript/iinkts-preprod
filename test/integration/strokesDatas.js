const hStrokes = require("./strokes/h.json")
module.exports.h = {
  type: "TEXT",
  strokes: hStrokes,
  exports: {
    "text/plain": ["h"],
    "application/vnd.myscript.jiix": {
      type: "Text",
      label: "h",
      words: [
        {
          label: "h",
          candidates: ["h", "k", "hi", "hr", "hn"],
        },
      ],
      version: "3",
      id: "MainBlock",
    },
  },
}

const helloStrokes = require("./strokes/hello.json")
module.exports.hello = {
  type: "TEXT",
  strokes: helloStrokes,
  exports: {
    "text/plain": ["h", "he", "hel", "hell", "hello"],
    "application/vnd.myscript.jiix": {
      type: "Text",
      label: "hello",
      words: [
        {
          label: "hello",
          candidates: ["hello", "kello", "helloo", "hellor", "hello"],
        },
      ],
      version: "3",
      id: "MainBlock",
    },
  },
}

const helloStrike = require("./strokes/helloStrike.json")
module.exports.helloStrikeStroke = {
  name: "helloStrike",
  type: "TEXT",
  strokes: helloStrike,
  apiVersion: "V4",
  exports: {
    "text/plain": ["hello", ""],
  },
}

const helloOne = require("./strokes/helloOneStroke.json")
module.exports.helloOneStroke = {
  type: "TEXT",
  strokes: helloOne,
  exports: {
    "text/plain": ["hello"],
    "application/vnd.myscript.jiix": {
      type: "Text",
      label: "hello",
      words: [
        {
          label: "hello",
          candidates: ["hello", "helto", "helts", "kelto", "felto"],
        },
      ],
      version: "3",
      id: "MainBlock",
    },
  },
}

const helloHowAreYouStrokes = require("./strokes/helloHowAreYou.json")
module.exports.helloHowAreYou = {
  type: "TEXT",
  strokes: helloHowAreYouStrokes,
  exports: {
    "text/plain": [
      "hello",
      "hello how",
      "hello how o",
      "hello how are",
      "hello how are you",
      "hello how are you?",
      "hello how are you?",
    ],
  },
}

const oneStrokes = require("./strokes/one.json")
module.exports.one = {
  type: "MATH",
  strokes: oneStrokes,
  exports: {
    LATEX: ["1"],
  },
}

const equation1Stroke = require("./strokes/equation1.json")
module.exports.equation1 = {
  type: "MATH",
  strokes: equation1Stroke,
  exports: {
    LATEX: ['y', 'y-', 'y=', 'y=3', 'y=30', 'y=3x', 'y=3x-', 'y=3x+', 'y=3x+2'],
    MATHML: {
      STANDARD: `<math xmlns='http://www.w3.org/1998/Math/MathML'><mi> y </mi><mo> = </mo><mn> 3 </mn><mi> x </mi><mo> + </mo><mn> 2 </mn></math>`
    }
  },
}

const equation2Stroke = require('./strokes/equation2.json')
module.exports.equation2 = {
  type: 'MATH',
  strokes: equation2Stroke,
  exports: {
    LATEX: ['-', '\\sqrt {2}', 'r', '']
  },
}

const fenceStroke = require("./strokes/fence.json")
module.exports.fence = {
  type: "MATH",
  strokes: fenceStroke,
  exports: {
    MATHML: {
      STANDARD: [
        "<math xmlns='http://www.w3.org/1998/Math/MathML'>\n" +
          "    <mrow>\n" +
          "        <mo> { </mo>\n" +
          "        <mtable columnalign='left'>\n" +
          "            <mtr>\n" +
          "                <mtd>\n" +
          "                    <msqrt>\n" +
          "                        <mn> 3 </mn>\n" +
          "                    </msqrt>\n" +
          "                </mtd>\n" +
          "            </mtr>\n" +
          "            <mtr>\n" +
          "                <mtd>\n" +
          "                    <msqrt>\n" +
          "                        <mn> 6 </mn>\n" +
          "                    </msqrt>\n" +
          "                </mtd>\n" +
          "            </mtr>\n" +
          "        </mtable>\n" +
          "    </mrow>\n" +
          "</math>",
      ],
      MSOFFICE: [
        "<math xmlns='http://www.w3.org/1998/Math/MathML'>\n" +
          '    <mfenced open="{" close="">\n' +
          "        <mtable columnalign='left'>\n" +
          "            <mtr>\n" +
          "                <mtd>\n" +
          "                    <msqrt>\n" +
          "                        <mn> 3 </mn>\n" +
          "                    </msqrt>\n" +
          "                </mtd>\n" +
          "            </mtr>\n" +
          "            <mtr>\n" +
          "                <mtd>\n" +
          "                    <msqrt>\n" +
          "                        <mn> 6 </mn>\n" +
          "                    </msqrt>\n" +
          "                </mtd>\n" +
          "            </mtr>\n" +
          "        </mtable>\n" +
          "    </mfenced>\n" +
          "</math>",
      ],
    },
  },
}

const lineStroke = require("./strokes/line.json")
module.exports.line = {
  type: "DIAGRAM",
  strokes: lineStroke,
  exports: [
    {
      "application/vnd.myscript.jiix": {
        type: "Diagram",
        elements: [
          {
            type: "Edge",
            kind: "line",
            connected: [],
            ports: [],
            x1: 60.0628433,
            y1: 47.2759743,
            x2: 98.6923065,
            y2: 47.064743,
          },
        ],
        version: "3",
        id: "MainBlock",
      },
    },
  ],
}

const rectangleStroke = require("./strokes/rectangle.json")
module.exports.rectangle = {
  type: "DIAGRAM",
  strokes: rectangleStroke,
  exports: [
    {
      "application/vnd.myscript.jiix": {
        type: "Diagram",
        elements: [
          {
            type: "Edge",
            kind: "line",
            connected: [],
            ports: [],
            x1: 57.5700951,
            y1: 52.1299248,
            x2: 56.6754112,
            y2: 71.9691315,
          },
        ],
        version: "3",
        id: "MainBlock",
      },
    },
    {
      "application/vnd.myscript.jiix": {
        type: "Diagram",
        elements: [
          {
            type: "Node",
            kind: "rectangle",
            x: 57.1401787,
            y: 52.4829941,
            width: 32.5525246,
            height: 18.9110947,
          },
        ],
        version: "3",
        id: "MainBlock",
      },
    },
  ],
}

const ponyEraseStroke = require("./strokes/ponyErase.json")
module.exports.ponyErase = {
  type: "TEXT",
  strokes: ponyEraseStroke,
  exports: [
    {
      "application/vnd.myscript.jiix": {
        type: "Text",
        label: "pony",
        words: [
          {
            label: "pony",
            candidates: ["pony", "Pony", "pong", "pory", "fony"],
          },
        ],
        version: "3",
        id: "MainBlock",
      },
    },
    {
      "application/vnd.myscript.jiix": {
        type: "Text",
        label: "ony",
        words: [
          {
            label: "ony",
          },
        ],
        version: "3",
        id: "MainBlock",
      },
    },
  ],
}

module.exports.ponyErasePrecisely = {
  type: "TEXT",
  strokes: ponyEraseStroke,
  exports: [
    {
      "application/vnd.myscript.jiix": {
        type: "Text",
        label: "pony",
        words: [
          {
            label: "pony",
            candidates: ["pony", "Pony", "pong", "pory", "fony"],
          },
        ],
        version: "3",
        id: "MainBlock",
      },
    },
    {
      "application/vnd.myscript.jiix": {
        type: "Text",
        label: "pony",
        words: [
          {
            label: "pony",
            candidates: ["pony", "oony", "rony", "wony", "pony"],
          },
        ],
        version: "3",
        id: "MainBlock",
      },
    },
  ],
}

const sumStroke = require('./strokes/sum.json')
module.exports.sum = {
  type: 'MATH',
  strokes: sumStroke,
  exports: {
    LATEX: ['3', '3-', '3+', '3+1', '3+1-', '3+1=', '3+1=4']
  },
}

const sumSimpleStroke = require('./strokes/sumSimple.json')
module.exports.sumSimple = {
  type: 'MATH',
  strokes: sumSimpleStroke,
  exports: {
    LATEX: ['1', '1-', '1+', '1+3']
  },
}

const threeScratchOutStrokes = require('./strokes/threeScratchOut.json')
module.exports.threeScratchOut = {
  type: 'MATH',
  strokes: threeScratchOutStrokes,
  exports: {
    LATEX: ['3', '']
  },
  converts: {
    LATEX: ['']
  }
}

const parisStrokes = require("./strokes/interact/paris.json")
module.exports.paris = {
  type: "TEXT",
  strokes: parisStrokes,
  exports: {
    "text/plain": ["paris"],
    "application/vnd.myscript.jiix": {
      type: "Text",
      label: "paris",
      words: [
        {
          label: "paris",
          candidates: ["paris"],
        },
      ],
      version: "3",
      id: "MainBlock",
    },
  },
}

const tokyoStrokes = require("./strokes/interact/tokyo.json")
module.exports.tokyo = {
  type: "TEXT",
  strokes: tokyoStrokes,
  exports: {
    "text/plain": ["t", "to", "tok", "toky", "tokyo"],
    "application/vnd.myscript.jiix": {
      type: "Text",
      label: "tokyo",
      words: [
        {
          label: "tokyo",
          candidates: ["tokyo"],
        },
      ],
      version: "3",
      id: "MainBlock",
    },
  },
}

const madridStrokes = require("./strokes/interact/madrid.json")
module.exports.madrid = {
  type: "TEXT",
  strokes: madridStrokes,
  exports: {
    "text/plain": ["madrid"],
    "application/vnd.myscript.jiix": {
      type: "Text",
      label: "madrid",
      words: [
        {
          label: "madrid",
          candidates: ["madrid"],
        },
      ],
      version: "3",
      id: "MainBlock",
    },
  },
}

const romeStrokes = require("./strokes/interact/rome.json")
module.exports.rome = {
  type: "TEXT",
  strokes: romeStrokes,
  exports: {
    "text/plain": ["rome"],
    "application/vnd.myscript.jiix": {
      type: "Text",
      label: "rome",
      words: [
        {
          label: "rome",
          candidates: ["rome"],
        },
      ],
      version: "3",
      id: "MainBlock",
    },
  },
}

const buenosAiresStrokes = require("./strokes/interact/buenosAires.json")
module.exports.buenosAires = {
  type: "TEXT",
  strokes: buenosAiresStrokes,
  exports: {
    "text/plain": ["buenos aires"],
    "application/vnd.myscript.jiix": {
      type: "Text",
      label: "buenos aires",
      words: [
        {
          label: "buenos aires",
          candidates: ["buenos aires"],
        },
      ],
      version: "3",
      id: "MainBlock",
    },
  },
}

const abrausorusStrokes = require("./strokes/abrausorus.json")
module.exports.abrausorus = {
  type: "TEXT",
  strokes: abrausorusStrokes,
  exports: {
    "text/plain": ["abrausorus"],
    "application/vnd.myscript.jiix": {
      type: "Text",
      label: "abrausorus",
      words: [
        {
          label: "abrausorus",
          candidates: ["abrausorus"],
        },
      ],
      version: "3",
      id: "MainBlock",
    },
  },
}

const centralProcessingUnitStrokes = require("./strokes/multiple-inputs/centralProcessingUnit.json")
module.exports.centralProcessingUnit = {
  type: "TEXT",
  strokes: centralProcessingUnitStrokes,
  exports: {
    "text/plain": "central processing unit",
  },
}

const Strokes1943 = require("./strokes/multiple-inputs/1943.json")
module.exports.oneThousandNineHundredAndFortyThree = {
  type: "TEXT",
  strokes: Strokes1943,
  exports: {
    "text/plain": "1943",
  },
}

const Strokes1993 = require("./strokes/multiple-inputs/1993.json")
module.exports.oneThousandNineHundredAndNintyThree = {
  type: "TEXT",
  strokes: Strokes1993,
  exports: {
    "text/plain": "1993",
  },
}

const helloOneSurrounded = require("./strokes/helloOneStrokeSurrounded.json")
module.exports.helloOneSurrounded = {
  type: "TEXT",
  strokes: helloOneSurrounded,
  exports: {
    "text/plain": ["hello"],
    "application/vnd.myscript.jiix": {
      type: "Text",
      label: "hello",
      words: [
        {
          label: "hello",
          candidates: ["hello", "helto", "helts", "kelto", "felto"],
        },
      ],
      version: "3",
      id: "MainBlock",
    },
  },
}

const covfefeStrokes = require("./strokes/covfefe.json")
module.exports.covfefe = {
  type: "TEXT",
  strokes: covfefeStrokes,
  exports: {
    "text/plain": ["covfefe"],
  },
}

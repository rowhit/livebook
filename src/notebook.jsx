var $         = require("jquery")
var React     = require("react")
var marked    = require("marked")
var AceEditor = require('react-ace');

// these three lines came from skulpt repl.js codebase
var importre = new RegExp("\\s*import")
var defre = new RegExp("def.*|class.*")
var assignment = /^((\s*\(\s*(\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*,)*\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*\)\s*)|(\s*\s*(\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*,)*\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*\s*))=/;
var indent = /^\s+/

function python_render(cell,result) {
  var $cell = Sk.ffi.remapToJs(cell)
  var $result = Sk.ffi.remapToJs(result)
  _buffer.push($result)
  iPython.cells[$cell].outputs = [
    {
     "data": {
      "text/plain": _buffer
     },
     "execution_count": 1,
     "metadata": {},
     "output_type": "execute_result"
    }
  ]
  _buffer = []
}

var _buffer = []

Sk.builtins["render"] = python_render
Sk.configure({output: text => _buffer.push(text) })

var Mode = "nav";
var CursorCell = 0;
var iPython = { cells:[] }
var mountNode = document.getElementById('mount')
var cellHeights = []

var editor       = n => ace.edit("edit"+n)
var useEditor    = function(cell) { return (cell.props.index == CursorCell && Mode == "edit") }
var editorClass  = function(cell)  { return !useEditor(cell) ? "hidden" : "" }
var displayClass = function(cell) { return  useEditor(cell) ? "hidden" : "" }

function onChangeFunc(i) { return e => iPython.cells[i].source = e.split("\n").map( s => s + "\n") }
function onChangePythonFunc(i) {
  var f1 = onChangeFunc(i)
  return e => { f1(e); python_eval() }
}
function rawMarkup(lines) { return { __html: marked(lines.join(""), {sanitize: true}) } }
function cursor(i) {
  if (i != CursorCell) return ""
  if (Mode == "nav")   return "cursor"
  else                 return "cursor-edit"
}

function render() {
  React.render(<Notebook data={iPython} />, mountNode);
}

function moveCursor(delta) {
  if (Mode != "nav") return;
  var newCursor = CursorCell + delta;
  if (newCursor >= iPython.cells.length || newCursor < 0) return;
  CursorCell = newCursor;
  render();
  $('body').animate({ scrollTop: $('.cursor').offset().top - 80 });
}

function captureCellHeight() {
  var cells = $(".switch")
  for (var i = 0; i < cells.length; i++) {
    cellHeights[i] = cells[i].offsetHeight + "px" // or .clientHeight
  }
}

function setMode(m) {
  Mode = m;
  captureCellHeight()
  render();

  if (Mode == "edit") {
    var editor = ace.edit("edit" + CursorCell)
    editor.focus()
    editor.getSession().setUseWrapMode(true);
  }
}

$('body').keyup(function(e) {
  switch (e.which) {
    case 27: // esc
      setMode("nav");
      break;
    case 38: // up
      moveCursor(-1);
      break;
    case 40: // down
      moveCursor(1);
      break;
  }
})

$('body').keypress(function(e) {
  if (Mode != "nav") return;

  switch (e.which) {
    case 101:
      setMode("edit");
      e.preventDefault();
      break;
    case 107: //k
    case 113: //q
      moveCursor(-1);
      e.preventDefault();
      break;
    case 106: //j
    case 97:  //a
      moveCursor(1);
      e.preventDefault();
      break;
  }
});


// todo
var python_eval = function() {
  var lines = []
  var lineno = 0
  var lineno_map = {}
  iPython.cells.forEach((c,i) => {
    console.log(c)
    if (c.cell_type == "code") {
      var valid = false
      editor(i).getSession().clearAnnotations()
      c.source.forEach((line,line_number) => {
        if (!line.match(/^\s*$/)) {
          valid = true
          lineno += 1
          lineno_map[lineno] = { cell: i, line: line_number }
          lines.push(line)
        }
      })
      if (!valid) {
        lines.push("render(" + i + ",None)\n")
      } else {
        var line = lines.pop()
        if (!assignment.test(line) && !defre.test(line) && !importre.test(line) && !indent.test(line)) {
          lines.push("render(" + i + ",(" + line.trim() + "))\n")
        } else {
          lines.push(line)
          lines.push("render(" + i + ",None)\n")
        }
      }
    }
  })
  console.log(lines)
  if (lines.length > 0) {
    try {
    var code = lines.join("")
    console.log(code)
    eval(Sk.importMainWithBody("<stdin>", false, code))
    } catch (e) {
      handle_error(lineno_map,e)
    }
  }
  render()
}

function handle_error(lineno_map, e) {
  console.log("handle_error",e)
  var err_at = lineno_map[e.traceback[0].lineno] || lineno_map[e.traceback[0].lineno - 1]
  var msg = Sk.ffi.remapToJs(e.args)[0]
  editor(err_at.cell).getSession().setAnnotations([{
    row: err_at.line,
    text: msg,
    type: "error" // also warning and information
  }]);
}

var MarkdownCell = React.createClass({
  render: function() {
    return ( <div className="cell switch">
              <div className={displayClass(this)} dangerouslySetInnerHTML={rawMarkup(this.props.data.source)} />
              <AceEditor className={editorClass(this)} mode="markdown" height={cellHeights[this.props.index]} width="100%" value={this.props.data.source.join("")} cursorStart={-1} theme="github" onChange={onChangeFunc(this.props.index)} name={"edit" + this.props.index} editorProps={{$blockScrolling: true}} />
            </div>)
  }
});

var CodeCell = React.createClass({
  html: function(data) { return (data && <div dangerouslySetInnerHTML={{__html: data.join("") }} />) },
  png:  function(data) { return (data && <img src={"data:image/png;base64," + data} />) },
  text: function(data) { return (data && data.join("\n")) },
  outputs:  function() { return (this.props.data.outputs.map(output =>
      this.html(output.data["text/html"]) ||
      this.png(output.data["image/png"])  ||
      this.text(output.data["text/plain"])
  ))},
 editor: function() {
    return <AceEditor className={editorClass(this)} mode="python" height={cellHeights[this.props.index]} width="100%" value={this.props.data.source.join("")} cursorStart={-1} theme="github" onChange={onChangePythonFunc(this.props.index)} name={"edit" + this.props.index} editorProps={{$blockScrolling: true}} />
 },
 code: function() {
    return <div className={"code " + displayClass(this)}>{this.props.data.source.join("")}</div>
 },
  render: function() { return (
    <div className="cell">
      <div className="cell-label">In [{this.props.index}]:</div>
        <div className="switch">
          {this.editor()}
          <div className="codewrap"> {this.code()} </div>
        </div>
      <div className="yields"><img src="yield-arrow.png" alt="yields" /></div>
      <div className="cell-label">Out[{this.props.index}]:</div>
      {this.outputs()}
    </div>)
  }
});

var Cell = React.createClass({
  subcell: function() {
    if (this.props.data.cell_type == "markdown")
      return <MarkdownCell data={this.props.data} index={this.props.index}/>
    else
      return <CodeCell data={this.props.data} index={this.props.index}/>
  },
  render: function() {
    return <div className={cursor(this.props.index)}> {this.subcell()} </div>
  }
})

var Notebook = React.createClass({
  cells: function() {
    return this.props.data.cells.map((cell,index) => <Cell data={cell} index={index}/>)
  },
  render: function() {
    return <div className="notebook">{this.cells()}</div>
  },
})

//$.get("waldo.ipynb",function(data) {
$.get("oneplusone.ipynb",function(data) {
  iPython = data
  render()
}, "json")

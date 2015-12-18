let React = require('react');
let ReactDOM = require('react-dom');
let Editor = require('./notebook-flowing-editor');
let CodeCellV2 = require('./code-cell-v2');

let {htmlToIPy} = require("../ipython-converter.jsx");

let CodeOverlaysContainer = React.createClass({

  createCodeCell(id, pythonCode, result) {
    return (
      <CodeCellV2 key={id} index={id} 
        result={result}
        code={pythonCode} 
        handleClick={this.handleCodeCellClick}
        handleEditorChange={this.handleEditorChange} />
    );
  },

  handleEditorChange(id, code) {
    this.props.handleEditorChange(id, code);
  },

  handleCodeCellClick(codeCellData) {
    return this.props.handleCodeCellClick(codeCellData);
  },

  renderCodeCells() {
    let codeList = this.props.codeList;
    let codeMap = this.props.codeMap;
    let codeResults = this.props.codeResults;
    let notebookCode = codeList.map((id) => this.createCodeCell(id, codeMap[id], codeResults[id]));

    return notebookCode;
  },

  render() {
    return (
      <div data-livebook-overlays>
        {this.renderCodeCells()}
      </div>
    );
  }
});


let NotebookV2 = React.createClass({

  getInitialState() {
    return {
      codeList: [],
      codeMap: {},
      results: {},
    };
  },

  componentWillMount() {
    this.setState({
      codeList: Object.keys(this.props.code),
      codeMap: this.props.code,
    });
  },

  handleCodeCellClick(codeCellData) {
    let {index, code, node} = codeCellData;
    let nodeBox = node.getBoundingClientRect();
    let {top, left, height, width} = nodeBox;
    let position = {top, left};

    let change = codeCellData.handleChange;

    this.renderEditor({
      code,
      height,
      width,
      position,
      change,
    });
  },

  handleEditorClick() {
    this.hideCodeEditor();
  },

  hideCodeEditor() {
    if (this.props.hideCodeEditor) {
      this.props.hideCodeEditor();
    }
  },

  handleNewResult(codeListIndex, result) {
    let id = this.state.codeList[codeListIndex];
    if (id === undefined) return;

    let nextResults = Object.assign({}, this.state.results);
    nextResults[id] = result;

    this.setState({
      results: nextResults,
    });
  },

  renderEditor(options) {
    if (this.props.renderCodeEditor) {
      this.props.renderCodeEditor(options);
    }
  },

  getCurrentCode(id) {
    return this.state.codeMap[id];
  },

  handleEditorChange(id, code) {
    let nextCodeMap = Object.assign({}, this.state.codeMap);
    nextCodeMap[id] = code;
    this.setState({ codeMap: nextCodeMap, });

    this.executePython();
  },

  handleCodeChange(data) {
    let {codeDelta, codeList} = data;
    let nextCodeMap = Object.assign({}, this.state.codeMap, codeDelta);
    this.setState({
      codeMap: nextCodeMap,
      codeList,
    });

    this.executePython()
  },

  executePython() {
    let codeBlocks = this.state.codeList.map((id) => this.state.codeMap[id])
    this.props.executePython(codeBlocks, this.handleNewResult);
  },

  render() {
    return (
      <div className="notebook">
        <Editor 
          text={this.props.html} 
          onCodeChange={this.handleCodeChange}
          onClick={this.handleEditorClick} 
          getCurrentCodeList={ () => this.state.codeList}
          getCurrentCode={this.getCurrentCode} /> 
        <CodeOverlaysContainer 
          codeResults={this.state.results}
          codeList={this.state.codeList} 
          codeMap={this.state.codeMap}
          handleEditorChange={this.handleEditorChange}
          handleCodeCellClick={this.handleCodeCellClick} /> 
      </div>
    );
  },
});

module.exports = NotebookV2;
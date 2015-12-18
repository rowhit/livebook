let React = require('react');
let ReactDOM = require('react-dom');
let Editor = require('./notebook-flowing-editor');
let CodeCellV2 = require('./code-cell-v2');

let {htmlToIPy} = require("../ipython-converter.jsx");

let CodeOverlaysContainer = React.createClass({

  hideCodeEditorOnEsc(event) {
    if (event.which === 27) {
      this.props.store.dispatch({ type: "CLOSE_CODE_EDITOR", })
    }
  },

  componentWillMount() {
    document.body.addEventListener("keydown", this.hideCodeEditorOnEsc);
  },

  componentWillUnmount() {
    document.body.removeEventListener("keydown", this.hideCodeEditorOnEsc);

  },

  createCodeCell(id) {
    let code = this.props.codeMap[id];
    let result = this.props.codeResults[id];
    return (
      <CodeCellV2 
        key={id} index={id} 
        result={result}
        code={code} 
        store={this.props.store}
        handleEditorChange={this.handleEditorChange} />
    );
  },

  handleEditorChange(id, code) {

    this.props.store.dispatch({
      type: "CODE_EDITOR_CHANGE",
      data: { id, code, },
    });

    this.props.handleEditorChange(id, code);
  },

  renderCodeCells() {
    return this.props.codeList.map(this.createCodeCell);
  },

  render() {
    return (
      <div data-livebook-overlays="">
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
    if (id === undefined) return; // stops us from rendering result of cell that has since been deleted

    let nextResults = {...this.state.results};
    nextResults[id] = result;

    this.setState({ results: nextResults, });

    // this.props.store.dispatch({
    //   type: "NEW_RESULT",
    //   data: {
    //     codeListIndex,
    //     result,
    //   }
    // });

  },

  getCurrentCode(id) {
    return this.state.codeMap[id];
  },

  handleEditorChange(id, code) {
    let nextCodeMap = {...this.state.codeMap};
    nextCodeMap[id] = code;
    this.setState({ codeMap: nextCodeMap, });

    this.executePython();
  },

  handleCodeChange(data) {
    let {codeDelta, codeList} = data; // rename codeDelta to "newCode", orion was right
    let {codeMap} = this.state;
    let nextCodeMap = {...codeMap, ...codeDelta}; // same as `Object.assign({}, codeMap, codeDelta);``

    this.setState({
      codeMap: nextCodeMap,
      codeList,
    });

    this.executePython()
  },

  executePython() {
    let codeBlocks = this.state.codeList.map((id) => this.state.codeMap[id])
    this.props.executePython(codeBlocks, this.handleNewResult); // mem: NEXT_CALLBACK
  },

  render() {
    return (
      <div className="notebook">
        <Editor 
          results={this.state.results} 
          text={this.props.html} 
          onCodeChange={this.handleCodeChange}
          onClick={this.handleEditorClick} 
          getCurrentCodeList={ () => this.state.codeList}
          getCurrentCode={this.getCurrentCode} /> 
        <CodeOverlaysContainer 
          store={this.props.store}
          codeResults={this.state.results}
          codeList={this.state.codeList} 
          codeMap={this.state.codeMap}
          handleEditorChange={this.handleEditorChange} /> 
      </div>
    );
  },
});

module.exports = NotebookV2;
import React from './react';
import ReactDOM from './react-dom';


class ClassTextInput extends React.Component {
  constructor(props) {
    super(props);
    this.inputRef = React.createRef();
  }
  getFocus = () => {
    this.inputRef.current.focus();
  }
  render() {
    return <input type="text" ref={this.inputRef}/>
  }
}

function FunctionTextInput(props,forwardRef) {
  return <input type="text" ref={forwardRef}/>
}

const ForWardTextInput = React.forwardRef(FunctionTextInput)

class Form extends React.Component {
  constructor(props) {
    super(props);
    this.inputRef = React.createRef();
  }
  handleFocus = () => {
    this.inputRef.current.focus();
  }
  render() {
    return (
      <div>
        <ForWardTextInput ref={this.inputRef}/>
        <button onClick={this.handleFocus}>focus</button>
      </div>
    )
  }
}

ReactDOM.render(<Form/>, document.getElementById('root'));

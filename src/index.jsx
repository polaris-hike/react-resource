import React from './react';
import ReactDOM from './react-dom';



const element2 = React.createElement('h1',{
  className: 'title',
  style: {
    color: 'red'
  }
}, 'hello',React.createElement('span',null,'world'))

function FunctionComponent2(props) {
  return <h1>{props.title}</h1>
}

function FunctionComponent(props) {
  return <FunctionComponent2 title={props.title + 'FunctionComponent'} />
}

class ClassComponent extends React.Component{
  constructor(props) {super(props);}
  render() {
    return <FunctionComponent2 title={this.props.title + 'FunctionComponent'} />
  }
}

class Counter extends React.Component{
  constructor(props) {
    super(props)
    this.state = {
      count:0
    }
  }
  onClick = () => {
    this.setState({count:this.state.count+1});
    console.log(this.state.count);
    this.setState({count:this.state.count+1});
    console.log(this.state.count);
    setTimeout(() => {
      this.setState({count:this.state.count+1});
      console.log(this.state.count);
      this.setState({count:this.state.count+1});
      console.log(this.state.count);
    })
    // this.setState((state)=>({count:state.count+1}))
    // this.setState((state)=>({count:state.count+1}))
    console.log(this.state);
  }
  render() {
    return (
      <div>
        <p>{this.props.title}</p>
        <p>{this.state.count}</p>
        <button onClick={this.onClick}>+1</button>
      </div>
    )
  }
}

const element = React.createElement(Counter,{title: "标题"});
console.log(element);
ReactDOM.render(element,document.getElementById('root'))

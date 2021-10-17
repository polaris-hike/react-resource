import React from './react';
import ReactDOM from './react-dom';

class Counter extends React.Component {
  //1.设置默认属性和初始状态
  static defaultProps = {
    name: '珠峰架构'
  }
  constructor(props) {
    super(props);
    this.state = { number: 0 };//设置默认状态
    console.log('Counter 1.constructor');
  }
  componentWillMount() {
    console.log('Counter 2.componentWillMount');
  }
  handleClick = (event) => {
    this.setState({ number: this.state.number + 1 });
  }
  shouldComponentUpdate(nextProps, nextState) {
    console.log('Counter 5.shouldComponentUpdate');
    //奇数不更新，偶数更新
    return nextState.number % 2 === 0;
  }
  componentWillUpdate() {
    console.log('Counter 6.componentWillUpdate');
  }
  render() {
    console.log('Counter 3.render');
    return (
      <div>
        <p>{this.state.number}</p>
        {this.state.number === 4 ? null : <ChildCounter count={this.state.number} />}
        <button onClick={this.handleClick}>+</button>
      </div>
    )
  }
  componentDidUpdate() {
    console.log('Counter 7.componentDidUpdate');
  }
  componentDidMount() {
    console.log('Counter 4.componentDidMount');
  }
}
class ChildCounter extends React.Component {
  componentWillUnmount() {
    console.log('ChildCounter 6.componentWillUnmount');
  }
  componentWillMount() {
    console.log('ChildCounter 1.componentWillMount');
  }
  componentDidMount() {
    console.log('ChildCounter 3.componentDidMount');
  }
  componentWillReceiveProps(nextProps) {
    console.log('ChildCounter 4.componentWillReceiveProps');
  }
  shouldComponentUpdate(nextProps, nextState) {
    console.log('ChildCounter 5.shouldComponentUpdate');
    //只有属性中有count值是3的倍数的话才更新，否则不更新
    //0 3 6 9更新，其它的数不更新
    return nextProps.count % 3 === 0;
  }
  render() {
    console.log('ChildCounter 2.render');
    return (
      <div>
        {this.props.count}
      </div>
    )
  }
}
ReactDOM.render(<Counter/>, document.getElementById('root'));

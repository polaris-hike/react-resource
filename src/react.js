import {wrapToVdom} from './utils';
import {createDOM} from './react-dom'

export const updateQueue = {
  isBatchingUpdate: false, // NOTE: 默认非批量更新 同步
  updaters: [],
  batchUpdate() {
    for (const updater of updateQueue.updaters) {
      updater.updateComponent();
    }
    updateQueue.updaters.length = 0;
    updateQueue.isBatchingUpdate = false;
  }
}

function createElement(type, config, children) {
  let ref;
  let key;

  if (config) {
    delete config.__source;
    delete config.__self;
    ref = config.ref;
    key = config.key;
    delete config.ref;
    delete config.key;
  }

  const props = {...config};

  props.children = arguments.length > 3 ? Array.prototype.slice.call(arguments, 2).map(wrapToVdom) : wrapToVdom(children);
  return {type, ref, key, props};
}

class Updater {
  constructor(classInstance) {
    this.classInstance = classInstance;
    this.pendingStates = []; // 等待生效的数组
  }

  addState(partialState) {
    this.pendingStates.push(partialState);
    this.emitUpdate();
  }

  emitUpdate() {
    // NOTE: 可能是批量异步更新 也可能是非批量的同步更新
    if (updateQueue.isBatchingUpdate) {
      // 批量异步更新
      updateQueue.updaters.push(this)
    } else {
      this.updateComponent();
    }
  }

  updateComponent() {
    const {classInstance, pendingStates} = this;
    if (pendingStates.length > 0) {
      shouldUpdate(classInstance, this.getState());
    }
  }

  getState() {
    const {classInstance, pendingStates} = this;
    let {state} = classInstance;
    pendingStates.forEach((partialState) => {
      if (typeof partialState === 'function') {
        partialState = partialState(state);
      }
      state = {...state, ...partialState};
    });
    pendingStates.length = 0
    return state;
  }
}

function shouldUpdate(classInstance,nextState) {
  classInstance.state = nextState;
  classInstance.forceUpdate();
}

class Component {
  static isReactComponent = true;

  constructor(props) {
    this.props = props;
    this.state = {};
    this.updater = new Updater(this);
  }

  setState(partialState) {
    this.updater.addState(partialState);
  }

  forceUpdate() {
    console.log(this.oldRenderVdom);
    const oldDOM = findDom(this.oldRenderVdom);
    const newRenderVDOM = this.render();

    compareTwoVDom(oldDOM.parentNode,this.oldRenderVdom,newRenderVDOM)
    this.oldRenderVdom = newRenderVDOM
  }
}

function compareTwoVDom(container,oldVDom,newVDom) {
  console.log(container);
  const oldDOM = findDom(oldVDom);
  const newDOM = createDOM(newVDom);
  container.replaceChild(newDOM,oldDOM);
}

function findDom(vdom) {
  if (!vdom) return null;
  let dom;
  if (vdom.dom) {
    return vdom.dom
  } else {
    return findDom(vdom.oldRenderVdom)
  }
}

const React = {createElement, Component};

export default React;

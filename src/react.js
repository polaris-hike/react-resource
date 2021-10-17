import {wrapToVdom} from './utils';
import {createDOM,updateProps} from './react-dom'
import {REACT_FORWARD_REF, REACT_TEXT} from './constants';

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

  emitUpdate(nextProps) {
    this.nextProps = nextProps;
    // NOTE: 可能是批量异步更新 也可能是非批量的同步更新
    if (updateQueue.isBatchingUpdate) {
      // 批量异步更新
      updateQueue.updaters.push(this)
    } else {
      this.updateComponent();
    }
  }

  updateComponent() {
    const {nextProps, classInstance, pendingStates} = this;
    if (nextProps || pendingStates.length > 0) {
      shouldUpdate(classInstance,this.nextProps, this.getState());
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

function shouldUpdate(classInstance,nextProps,nextState) {
  let willUpdate = true;

  if (classInstance.shouldComponentUpdate && !classInstance.shouldComponentUpdate(nextProps,nextState)) {
    willUpdate = false;
  }

  if (willUpdate && classInstance.componentWillUpdate) {
    classInstance.componentWillUpdate();
  }

  if (nextProps) {
    classInstance.props = nextProps;
  }

  classInstance.state = nextState;

  if (willUpdate) {
    classInstance.forceUpdate();
  }
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
    const oldDOM = findDom(this.oldRenderVdom);
    const newRenderVDOM = this.render();

    compareTwoVDom(oldDOM.parentNode,this.oldRenderVdom,newRenderVDOM)
    this.oldRenderVdom = newRenderVDOM;
    if (this.componentDidUpdate) {
      this.componentDidUpdate(this.props,this.state);
    }
  }
}

function compareTwoVDom(container,oldVDom,newVDom,nextDom) {
  if (!oldVDom && !newVDom) {
    return null;
  }  else if (oldVDom && !newVDom) {
    unMountVdom(oldVDom)
  } else if (!oldVDom && newVDom) {
    const newDom = createDOM(newVDom)
    container.appendChild(newDom);
    newDom._compoentDidMount && newDom._compoentDidMount();
  } else if (oldVDom && newVDom && oldVDom.type !== newVDom.type) {
    unMountVdom(oldVDom);
    const newDom = createDOM(newVDom);
    if (nextDom) {
      container.insertBefore(newDom,nextDom)
    } else {
      container.appendChild(newDom);
    }
    newDom._compoentDidMount && newDom._compoentDidMount();
  } else {
    updateElement(oldVDom,newVDom)
  }
}

function updateElement(oldVDom,newVDom) {
  if (oldVDom.type === REACT_TEXT) {
    if (oldVDom.props.content !== newVDom.props.content) {
      const currentDom = newVDom.dom = findDom(oldVDom);
      currentDom.textContent = newVDom.props.content;
    }
  } else if (typeof oldVDom.type === 'string') {
    // NOTE: 原生组件
    const currentDom = newVDom.dom = findDom(oldVDom);
    updateProps(currentDom,oldVDom.props,newVDom.props);
    updateChildren(currentDom,oldVDom.props.children,newVDom.props.children);
  } else if (typeof oldVDom.type === 'function') {
    if (oldVDom.type.isReactComponent) {
      // NOTE: 类组件
      updateClassComponent(oldVDom,newVDom)
    } else {
      // NOTE: 函数式组件
      updateFunctionComponent(oldVDom,newVDom)
    }
  }
}

function updateClassComponent(oldVDom,newVDom) {
  const classInstance = newVDom.classInstance = oldVDom.classInstance;
  newVDom.oldRenderVdom = oldVDom.oldRenderVdom;
  if (classInstance.componentWillReceiveProps) {
    classInstance.componentWillReceiveProps(newVDom.props);
  }
  classInstance.updater.emitUpdate(newVDom.props);
}

function updateFunctionComponent(oldVDom, newVDom) {
  const currentDom = findDom(oldVDom);
  const parentDom = currentDom.parentNode;
  const {type,props} = newVDom;
  const newRenderVdom = type(props);
  compareTwoVDom(parentDom,oldVDom.oldRenderVdom,newRenderVdom);
  newVDom.oldRenderVdom = newRenderVdom;
}

function updateChildren(parentDom,oldChildren,newChildren) {
  oldChildren = Array.isArray(oldChildren) ? oldChildren : oldChildren ? [oldChildren] : [];
  newChildren = Array.isArray(newChildren) ? newChildren : newChildren ? [newChildren] : [];
  const maxChildrenLength = Math.max(oldChildren.length,newChildren.length);
  for (let i = 0; i < maxChildrenLength;i++) {
    const nextVdom = oldChildren.find((item,index)=>index > i && item && findDom(item))
    compareTwoVDom(parentDom,oldChildren[i],newChildren[i],findDom(nextVdom))
  }
}

function unMountVdom(vdom) {
  const {props,ref} = vdom;
  const currentDom = findDom(vdom);
  if (vdom.classInstance && vdom.classInstance.componentWillUnmount) {
    vdom.classInstance.componentWillUnmount()
  }
  if (props && ref) {
    ref.current = null;
  }
  // NOTE: 取消监听函数
  Object.keys(props).forEach(() => {
    delete currentDom._store
  })
  if (props.children) {
    const children = Array.isArray(props.children) ? props.children : [props.children];
    children.forEach(unMountVdom)
  }
  currentDom && currentDom.parentNode.removeChild(currentDom);
}

function findDom(vdom) {
  if (!vdom) return null;
  if (vdom.dom) {
    return vdom.dom
  } else {
    return findDom(vdom.oldRenderVdom)
  }
}

function createRef() {
  return {current:null};
}

function forwardRef(render) {
  return {
    $$typeof:REACT_FORWARD_REF,
    render
  }
}

const React = {createElement, Component, createRef,forwardRef};

export default React;

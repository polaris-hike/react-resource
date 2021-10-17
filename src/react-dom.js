import {REACT_TEXT,REACT_FORWARD_REF} from './constants';
import {addEvent} from './event';

function render(vdom,container) {
  mount(vdom,container)
}

function mount(vdom,container) {
  const newDOM = createDOM(vdom);
  if (newDOM) {
    container.appendChild(newDOM)
    if (newDOM._compoentDidMount) newDOM._compoentDidMount();
  }
}

// NOTE: 虚拟 dom 转化为真实 dom
export function createDOM(vdom) {
  if (!vdom) return null;
  const {type, props, ref} = vdom;
  let dom;
  if (type && type.$$typeof === REACT_FORWARD_REF) {
    return mountForwardComponent(vdom);
  }else if (type === REACT_TEXT) {
    dom = document.createTextNode(props.content)
  } else if(typeof type === 'function') {
    if (type.isReactComponent) { // NOTE: 类组件
      return mountClassComponent(vdom)
    } else {
      return mountFunctionComponent(vdom)
    }
  } else {
    dom = document.createElement(type);
  }

  if (props) {
    updateProps(dom,{},props);
    const children =props.children;
    if (children) {
      if ( typeof children === 'object' && children.type) { // NOTE: 说明是一个 React 元素
        mount(children,dom)
      } else if  (Array.isArray(children)) {
        reconcileChildren(props.children, dom);
      }
    }
  }
  vdom.dom = dom;
  if (ref){
    ref.current = dom;
  }
  return dom;
}

function mountForwardComponent(vdom) {
  const {type, props, ref} = vdom;
  const renderVdom = type.render(props,ref);
  vdom.oldRenderVdom = renderVdom;
  return createDOM(renderVdom);
}

function mountClassComponent(vdom) {
  const {type, props, ref} = vdom;
  const classInstance = new type(props);
  if (ref) ref.current = classInstance;
  if (classInstance.componentWillMount) {
    classInstance.componentWillMount()
  }
  vdom.classInstance = classInstance;
  const renderVdom = classInstance.render();
  classInstance.oldRenderVdom =vdom.oldRenderVdom = renderVdom;
  const dom = createDOM(renderVdom);
  if (classInstance.componentDidMount) {
    dom._compoentDidMount = classInstance.componentDidMount.bind(classInstance);
  }
  return dom;
}

function mountFunctionComponent(vdom) {
  const {type, props} = vdom;
  const renderVdom =  type(props);
  vdom.oldRenderVdom = renderVdom;
  return createDOM(renderVdom);
}

function reconcileChildren(vdom,container) {
  vdom.forEach(child => mount(child,container))
}

export function updateProps(dom,oldProps,newProps) {
  for (const key in newProps) {
    if (key === 'children') {
      continue;// 后续处理
    } else if (key === 'style') {
      const styleObj = newProps[key];
      for (const attr in styleObj) {
        dom.style[attr] = styleObj[attr];
      }
    } else if(key.startsWith('on')) {
      addEvent(dom,key.toLocaleLowerCase(),newProps[key]);
      // dom[key.toLocaleLowerCase()] = newProps[key];
    } else {
      dom[key] = newProps[key];
    }
  }
}


const ReactDOM = {
  render
};

export default ReactDOM;

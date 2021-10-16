import {updateQueue} from './react';

// NOTE: 合成事件/事件委托
export function addEvent(dom,eventType,eventHandler) {
  let store;
  if (dom._store) {
    store = dom._store
  } else {
    dom._store = {};
    store = dom._store;
  }
  store[eventType] = eventHandler;
  if (!document[eventType]) {
    document[eventType] = dispatchEvent
  }
}

function dispatchEvent(event) {
 const {target,type} = event;
 const eventType = 'on' + type;
  updateQueue.isBatchingUpdate = true;
  const syntheticEvent = createSyntheticEvent(event);
  let currentTarget = target;

  // NOTE: 模拟冒泡过程
  while (currentTarget) {
    const {_store} = currentTarget;
    const eventHandler = _store && _store[eventType];
    if (eventHandler) {
      syntheticEvent.target = target;
      syntheticEvent.currentTarget = currentTarget;
      eventHandler && eventHandler.call(target,syntheticEvent);
    }
    currentTarget = currentTarget.parentNode;
  }
  updateQueue.isBatchingUpdate = false
  updateQueue.batchUpdate();
}

function createSyntheticEvent(nativeEvent) {
  const syntheticEvent = {nativeEvent};
  for (const key in nativeEvent) {
    syntheticEvent[key] = nativeEvent[key]
  }
  // NOTE: 此处会做一些浏览器的兼容性处理
  return syntheticEvent;
}

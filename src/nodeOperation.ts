import type { NodeElement, NodeObj } from './index'

import { createExpander, findEle, shapeTpc } from './utils/dom'
import {
  addParentLink,
  checkMoveValid,
  insertBeforeNodeObj,
  insertNodeObj,
  insertParentNodeObj,
  moveDownObj,
  moveNodeAfterObj,
  moveNodeBeforeObj,
  moveNodeObj,
  moveUpObj,
  refreshIds,
  removeNodeObj,
  rgbHex,
} from './utils/index'
const $d = document

function getNodeLineLength(obj: NodeObj) {
  let length = 1
  const recursion = (node: NodeObj, key: 'parent' | 'children') => {
    length += 1
    if (node?.[key]) {
      recursion(node[key] as NodeObj, key)
    }
  }
  recursion(obj, 'parent')
  return length
}

/**
 * @exports NodeOperation
 * @namespace NodeOperation
 */
export const updateNodeStyle = function (object) {
  if (!object.style) return
  const nodeEle = findEle(object.id, this)
  const origin = {
    color: nodeEle.style.color && rgbHex(nodeEle.style.color),
    background: nodeEle.style.background && rgbHex(nodeEle.style.background),
    fontSize: nodeEle.style.fontSize && nodeEle.style.fontSize + 'px',
    fontWeight: nodeEle.style.fontWeight,
  }
  nodeEle.style.color = object.style.color
  nodeEle.style.background = object.style.background
  nodeEle.style.fontSize = object.style.fontSize + 'px'
  nodeEle.style.fontWeight = object.style.fontWeight || 'normal'
  this.linkDiv()
  this.bus.fire('operation', {
    name: 'editStyle',
    obj: object,
    origin,
  })
}

// replace updateNodeXxxx with updateNode(object, newData)
export const updateNodeTags = function (object, tags) {
  const oldVal = object.tags
  object.tags = tags
  const nodeEle = findEle(object.id)
  shapeTpc(nodeEle, object)
  this.linkDiv()
  this.bus.fire('operation', {
    name: 'editTags',
    obj: object,
    origin: oldVal,
  })
}

export const updateNodeIcons = function (object, icons) {
  const oldVal = object.icons
  object.icons = icons
  const nodeEle = findEle(object.id)
  shapeTpc(nodeEle, object)
  this.linkDiv()
  this.bus.fire('operation', {
    name: 'editIcons',
    obj: object,
    origin: oldVal,
  })
}

export const updateNodeHyperLink = function (object, hyperLink) {
  const oldVal = object.hyperLink
  object.hyperLink = hyperLink
  const nodeEle = findEle(object.id)
  shapeTpc(nodeEle, object)
  this.linkDiv()
  this.bus.fire('operation', {
    name: 'editHyperLink',
    obj: object,
    origin: oldVal,
  })
}

/**
 * @function
 * @instance
 * @name insertSibling
 * @memberof NodeOperation
 * @description Create a sibling node.
 * @param {TargetElement} el - Target element return by E('...'), default value: currentTarget.
 * @param {node} node - New node information.
 * @example
 * insertSibling(E('bd4313fbac40284b'))
 */
export const insertSibling = function (el, node) {
  const nodeEle = el || this.currentNode
  if (!nodeEle) return
  const nodeObj = nodeEle.nodeObj
  if (nodeObj.root === true) {
    this.addChild()
    return
  }
  const newNodeObj = node || this.generateNewObj()
  insertNodeObj(nodeObj, newNodeObj)
  addParentLink(this.nodeData)
  const t = nodeEle.parentElement
  console.time('insertSibling_DOM')

  const { grp, top } = this.createGroup(newNodeObj)

  const children = t.parentNode.parentNode
  children.insertBefore(grp, t.parentNode.nextSibling)
  if (children.className === 'box') {
    this.judgeDirection(grp, newNodeObj)
    this.linkDiv()
  } else {
    this.linkDiv(grp.offsetParent)
  }
  if (!node) {
    this.createInputDiv(top.children[0])
  }
  this.selectNode(top.children[0], true)
  console.timeEnd('insertSibling_DOM')
  this.bus.fire('operation', {
    name: 'insertSibling',
    obj: newNodeObj,
  })
}

/**
 * @function
 * @instance
 * @name insertBefore
 * @memberof NodeOperation
 * @description Create a sibling node before the selected node.
 * @param {TargetElement} el - Target element return by E('...'), default value: currentTarget.
 * @param {node} node - New node information.
 * @example
 * insertBefore(E('bd4313fbac40284b'))
 */
export const insertBefore = function (el, node) {
  const nodeEle = el || this.currentNode
  if (!nodeEle) return
  const nodeObj = nodeEle.nodeObj
  if (nodeObj.root === true) {
    this.addChild()
    return
  }
  const newNodeObj = node || this.generateNewObj()
  insertBeforeNodeObj(nodeObj, newNodeObj)
  addParentLink(this.nodeData)
  const t = nodeEle.parentElement
  console.time('insertSibling_DOM')

  const { grp, top } = this.createGroup(newNodeObj)

  const children = t.parentNode.parentNode
  children.insertBefore(grp, t.parentNode)
  if (children.className === 'box') {
    this.judgeDirection(grp, newNodeObj)
    this.linkDiv()
  } else {
    this.linkDiv(grp.offsetParent)
  }
  if (!node) {
    this.createInputDiv(top.children[0])
  }
  this.selectNode(top.children[0], true)
  console.timeEnd('insertSibling_DOM')
  this.bus.fire('operation', {
    name: 'insertSibling',
    obj: newNodeObj,
  })
}

/**
 * @function
 * @instance
 * @name insertParent
 * @memberof NodeOperation
 * @description Create a parent node of the selected node.
 * @param {TargetElement} el - Target element return by E('...'), default value: currentTarget.
 * @param {node} node - New node information.
 * @example
 * insertParent(E('bd4313fbac40284b'))
 */
export const insertParent = function (el, node) {
  const nodeEle = el || this.currentNode
  if (!nodeEle) return
  const nodeObj = nodeEle.nodeObj
  if (nodeObj.root === true) {
    return
  }
  const newNodeObj = node || this.generateNewObj()
  insertParentNodeObj(nodeObj, newNodeObj)
  addParentLink(this.nodeData)

  // warning: the tricky part
  const grp0 = nodeEle.parentElement.parentElement
  console.time('insertParent_DOM')
  const { grp, top } = this.createGroup(newNodeObj, true)
  top.appendChild(createExpander(true))
  grp0.insertAdjacentElement('afterend', grp)

  const c = $d.createElement('children')
  c.appendChild(grp0)
  top.insertAdjacentElement('afterend', c)

  // if it's a main node previously
  if (grp0.parentNode.className === 'box') {
    grp.className = grp0.className // l/rhs
    grp0.className = ''
    grp0.querySelector('.subLines').remove()
    this.linkDiv()
  } else {
    this.linkDiv(grp.offsetParent)
  }

  if (!node) {
    this.createInputDiv(top.children[0])
  }
  this.selectNode(top.children[0], true)
  console.timeEnd('insertParent_DOM')
  this.bus.fire('operation', {
    name: 'insertParent',
    obj: newNodeObj,
  })
}

const initChildren = function (tpc) {
  const wrapper = tpc.parentNode
}

export const addChildFunction = function (nodeEle, node) {
  if (!nodeEle) return
  const nodeObj = nodeEle.nodeObj
  if (nodeObj.expanded === false) {
    this.expandNode(nodeEle, true)
    // dom had resetted
    nodeEle = findEle(nodeObj.id)
  }
  const newNodeObj = node || this.generateNewObj()
  if (nodeObj.children) nodeObj.children.push(newNodeObj)
  else nodeObj.children = [newNodeObj]
  addParentLink(this.nodeData)

  const top = nodeEle.parentElement

  const { grp, top: newTop } = this.createGroup(newNodeObj)
  // 先全部构建相同结构，减少这些判断？×
  // eliminate T tag
  if (top.tagName === 'T') {
    if (top.children[1]) {
      top.nextSibling.appendChild(grp)
    } else {
      const c = $d.createElement('children')
      c.appendChild(grp)
      top.appendChild(createExpander(true))
      top.insertAdjacentElement('afterend', c)
    }
    this.linkDiv(grp.offsetParent)
  } else if (top.tagName === 'ROOT') {
    this.judgeDirection(grp, newNodeObj)
    top.nextSibling.appendChild(grp)
    this.linkDiv()
  }
  return { newTop, newNodeObj }
}

/**
 * @function
 * @instance
 * @name addChild
 * @memberof NodeOperation
 * @description Create a child node.
 * @param {TargetElement} el - Target element return by E('...'), default value: currentTarget.
 * @param {node} node - New node information.
 * @example
 * addChild(E('bd4313fbac40284b'))
 */
export const addChild = function (el: NodeElement, node: NodeObj) {
  console.time('addChild')
  const nodeEle = el || this.currentNode
  if (!nodeEle) return
  if (this.maxDepth && this.maxDepth < getNodeLineLength(nodeEle.nodeObj)) {
    return
  }
  const { newTop, newNodeObj } = addChildFunction.call(this, nodeEle, node)
  this.bus.fire('operation', {
    name: 'addChild',
    obj: newNodeObj,
  })
  console.timeEnd('addChild')
  if (!node) {
    this.createInputDiv(newTop.children[0])
  }
  this.selectNode(newTop.children[0], true)
}
// uncertain link disappear sometimes??
// TODO while direction = SIDE, move up won't change the direction of main node

/**
 * @function
 * @instance
 * @name copyNode
 * @memberof NodeOperation
 * @description Copy node to another node.
 * @param {TargetElement} node - Target element return by E('...'), default value: currentTarget.
 * @param {TargetElement} to - The target(as parent node) you want to copy to.
 * @example
 * copyNode(E('bd4313fbac402842'),E('bd4313fbac402839'))
 */
export const copyNode = function (node: NodeElement, to: NodeElement) {
  console.time('copyNode')
  const deepCloneObj = JSON.parse(
    JSON.stringify(node.nodeObj, (k, v) => {
      if (k === 'parent') return undefined
      return v
    })
  )
  refreshIds(deepCloneObj)
  const { newNodeObj } = addChildFunction.call(this, to, deepCloneObj)
  console.timeEnd('copyNode')
  this.bus.fire('operation', {
    name: 'copyNode',
    obj: newNodeObj,
  })
}

/**
 * @function
 * @instance
 * @name moveUpNode
 * @memberof NodeOperation
 * @description Move the target node up.
 * @param {TargetElement} el - Target element return by E('...'), default value: currentTarget.
 * @example
 * moveUpNode(E('bd4313fbac40284b'))
 */
export const moveUpNode = function (el) {
  const nodeEle = el || this.currentNode
  if (!nodeEle) return
  const grp = nodeEle.parentNode.parentNode
  const obj = nodeEle.nodeObj
  moveUpObj(obj)
  grp.parentNode.insertBefore(grp, grp.previousSibling)
  this.linkDiv()
  this.bus.fire('operation', {
    name: 'moveUpNode',
    obj,
  })
}

/**
 * @function
 * @instance
 * @name moveDownNode
 * @memberof NodeOperation
 * @description Move the target node down.
 * @param {TargetElement} el - Target element return by E('...'), default value: currentTarget.
 * @example
 * moveDownNode(E('bd4313fbac40284b'))
 */
export const moveDownNode = function (el) {
  const nodeEle = el || this.currentNode
  if (!nodeEle) return
  const grp = nodeEle.parentNode.parentNode
  const obj = nodeEle.nodeObj
  moveDownObj(obj)
  if (grp.nextSibling) {
    grp.insertAdjacentElement('afterend', grp.nextSibling)
  } else {
    grp.parentNode.prepend(grp)
  }
  this.linkDiv()
  this.bus.fire('operation', {
    name: 'moveDownNode',
    obj,
  })
}

/**
 * @function
 * @instance
 * @name removeNode
 * @memberof NodeOperation
 * @description Remove the target node.
 * @param {TargetElement} el - Target element return by E('...'), default value: currentTarget.
 * @example
 * removeNode(E('bd4313fbac40284b'))
 */
export const removeNode = function (el) {
  const nodeEle = el || this.currentNode
  if (!nodeEle) return
  console.log('removeNode', nodeEle)
  const nodeObj = nodeEle.nodeObj
  if (nodeObj.root === true) {
    throw new Error('Can not remove root node')
  }
  const index = nodeObj.parent.children.findIndex(node => node === nodeObj)
  const next = nodeObj.parent.children[index + 1]
  const originSiblingId = next && next.id

  const childrenLength = removeNodeObj(nodeObj)
  const t = nodeEle.parentNode
  if (childrenLength === 0) {
    // remove epd when children length === 0
    const parentT = t.parentNode.parentNode.previousSibling
    // root doesn't have epd
    if (parentT.tagName !== 'ROOT') {
      parentT.children[1].remove()
    }
    this.selectParent()
  } else {
    // select sibling automatically
    this.selectPrevSibling() || this.selectNextSibling() || this.selectParent()
  }
  for (const prop in this.linkData) {
    // MAYBEBUG should traversal all children node
    const link = this.linkData[prop]
    if (link.from === t.firstChild || link.to === t.firstChild) {
      this.removeLink(this.mindElixirBox.querySelector(`[data-linkid=${this.linkData[prop].id}]`))
    }
  }
  // remove GRP
  t.parentNode.remove()
  this.linkDiv()
  this.bus.fire('operation', {
    name: 'removeNode',
    obj: nodeObj,
    originSiblingId,
    originParentId: nodeObj.parent.id,
  })
}

/**
 * @function
 * @instance
 * @name moveNode
 * @memberof NodeOperation
 * @description Move a node to another node (as child node).
 * @param {TargetElement} from - The target you want to move.
 * @param {TargetElement} to - The target(as parent node) you want to move to.
 * @example
 * moveNode(E('bd4313fbac402842'),E('bd4313fbac402839'))
 */
export const moveNode = function (from, to) {
  const fromObj = from.nodeObj
  const toObj = to.nodeObj
  const originParentId = fromObj.parent.id
  if (toObj.expanded === false) {
    this.expandNode(to, true)
    from = findEle(fromObj.id)
    to = findEle(toObj.id)
  }
  if (!checkMoveValid(fromObj, toObj)) {
    console.warn('Invalid move')
    return
  }
  console.time('moveNode')
  moveNodeObj(fromObj, toObj)
  addParentLink(this.nodeData) // update parent property
  const fromTop = from.parentElement
  const fromChilren = fromTop.parentNode.parentNode
  const toTop = to.parentElement
  if (fromChilren.className === 'box') {
    // clear svg group of main node
    fromTop.parentNode.lastChild.remove()
  } else if (fromTop.parentNode.className === 'box') {
    fromTop.style.cssText = '' // clear style
  }
  if (toTop.tagName === 'T') {
    if (fromChilren.className === 'box') {
      // clear direaction class of main node
      fromTop.parentNode.className = ''
    }
    if (toTop.children[1]) {
      // expander exist
      toTop.nextSibling.appendChild(fromTop.parentNode)
    } else {
      // expander not exist, no child
      const c = $d.createElement('children')
      c.appendChild(fromTop.parentNode)
      toTop.appendChild(createExpander(true))
      toTop.parentElement.insertBefore(c, toTop.nextSibling)
    }
  } else if (toTop.tagName === 'ROOT') {
    this.judgeDirection(fromTop.parentNode, fromObj)
    toTop.nextSibling.appendChild(fromTop.parentNode)
  }
  this.linkDiv()
  this.bus.fire('operation', {
    name: 'moveNode',
    obj: { fromObj, toObj, originParentId },
  })
  console.timeEnd('moveNode')
}

/**
 * @function
 * @instance
 * @name moveNodeBefore
 * @memberof NodeOperation
 * @description Move a node and become previous node of another node.
 * @param {TargetElement} from
 * @param {TargetElement} to
 * @example
 * moveNodeBefore(E('bd4313fbac402842'),E('bd4313fbac402839'))
 */
export const moveNodeBefore = function (from, to) {
  const fromObj = from.nodeObj
  const toObj = to.nodeObj
  const originParentId = fromObj.parent.id
  moveNodeBeforeObj(fromObj, toObj)
  addParentLink(this.nodeData)
  const fromTop = from.parentElement
  const fromGrp = fromTop.parentNode
  const toTop = to.parentElement
  const toGrp = toTop.parentNode
  const toChilren = toTop.parentNode.parentNode
  toChilren.insertBefore(fromGrp, toGrp)
  if (toGrp.className) fromGrp.className = toGrp.className
  this.linkDiv()
  this.bus.fire('operation', {
    name: 'moveNodeBefore',
    obj: { fromObj, toObj, originParentId },
  })
}

/**
 * @function
 * @instance
 * @name moveNodeAfter
 * @memberof NodeOperation
 * @description Move a node and become next node of another node.
 * @param {TargetElement} from
 * @param {TargetElement} to
 * @example
 * moveNodeAfter(E('bd4313fbac402842'),E('bd4313fbac402839'))
 */
export const moveNodeAfter = function (from, to) {
  const fromObj = from.nodeObj
  const toObj = to.nodeObj
  const originParentId = fromObj.parent.id
  moveNodeAfterObj(fromObj, toObj)
  addParentLink(this.nodeData)
  const fromTop = from.parentElement
  const fromGrp = fromTop.parentNode
  const toTop = to.parentElement
  const toGrp = toTop.parentNode
  const toChilren = toTop.parentNode.parentNode
  toChilren.insertBefore(fromGrp, toGrp.nextSibling)
  if (toGrp.className) fromGrp.className = toGrp.className
  this.linkDiv()
  this.bus.fire('operation', {
    name: 'moveNodeAfter',
    obj: { fromObj, toObj, originParentId },
  })
}

/**
 * @function
 * @instance
 * @name beginEdit
 * @memberof NodeOperation
 * @description Begin to edit the target node.
 * @param {TargetElement} el - Target element return by E('...'), default value: currentTarget.
 * @example
 * beginEdit(E('bd4313fbac40284b'))
 */
export const beginEdit = function (el) {
  const nodeEle = el || this.currentNode
  if (!nodeEle) return
  this.createInputDiv(nodeEle)
}

export const setNodeTopic = function (tpc, topic) {
  tpc.childNodes[0].textContent = topic
  tpc.nodeObj.topic = topic
  this.linkDiv()
}

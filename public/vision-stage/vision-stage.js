import log from './z-console.js';
export { default as log } from './z-console.js';

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const directives = new WeakMap();
/**
 * Brands a function as a directive factory function so that lit-html will call
 * the function during template rendering, rather than passing as a value.
 *
 * A _directive_ is a function that takes a Part as an argument. It has the
 * signature: `(part: Part) => void`.
 *
 * A directive _factory_ is a function that takes arguments for data and
 * configuration and returns a directive. Users of directive usually refer to
 * the directive factory as the directive. For example, "The repeat directive".
 *
 * Usually a template author will invoke a directive factory in their template
 * with relevant arguments, which will then return a directive function.
 *
 * Here's an example of using the `repeat()` directive factory that takes an
 * array and a function to render an item:
 *
 * ```js
 * html`<ul><${repeat(items, (item) => html`<li>${item}</li>`)}</ul>`
 * ```
 *
 * When `repeat` is invoked, it returns a directive function that closes over
 * `items` and the template function. When the outer template is rendered, the
 * return directive function is called with the Part for the expression.
 * `repeat` then performs it's custom logic to render multiple items.
 *
 * @param f The directive factory function. Must be a function that returns a
 * function of the signature `(part: Part) => void`. The returned function will
 * be called with the part object.
 *
 * @example
 *
 * import {directive, html} from 'lit-html';
 *
 * const immutable = directive((v) => (part) => {
 *   if (part.value !== v) {
 *     part.setValue(v)
 *   }
 * });
 */
const directive = (f) => ((...args) => {
    const d = f(...args);
    directives.set(d, true);
    return d;
});
const isDirective = (o) => {
    return typeof o === 'function' && directives.has(o);
};

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * True if the custom elements polyfill is in use.
 */
const isCEPolyfill = typeof window !== 'undefined' &&
    window.customElements != null &&
    window.customElements.polyfillWrapFlushCallback !==
        undefined;
/**
 * Reparents nodes, starting from `start` (inclusive) to `end` (exclusive),
 * into another container (could be the same container), before `before`. If
 * `before` is null, it appends the nodes to the container.
 */
const reparentNodes = (container, start, end = null, before = null) => {
    while (start !== end) {
        const n = start.nextSibling;
        container.insertBefore(start, before);
        start = n;
    }
};
/**
 * Removes nodes, starting from `start` (inclusive) to `end` (exclusive), from
 * `container`.
 */
const removeNodes = (container, start, end = null) => {
    while (start !== end) {
        const n = start.nextSibling;
        container.removeChild(start);
        start = n;
    }
};

/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * A sentinel value that signals that a value was handled by a directive and
 * should not be written to the DOM.
 */
const noChange = {};
/**
 * A sentinel value that signals a NodePart to fully clear its content.
 */
const nothing = {};

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * An expression marker with embedded unique key to avoid collision with
 * possible text in templates.
 */
const marker = `{{lit-${String(Math.random()).slice(2)}}}`;
/**
 * An expression marker used text-positions, multi-binding attributes, and
 * attributes with markup-like text values.
 */
const nodeMarker = `<!--${marker}-->`;
const markerRegex = new RegExp(`${marker}|${nodeMarker}`);
/**
 * Suffix appended to all bound attribute names.
 */
const boundAttributeSuffix = '$lit$';
/**
 * An updatable Template that tracks the location of dynamic parts.
 */
class Template {
    constructor(result, element) {
        this.parts = [];
        this.element = element;
        const nodesToRemove = [];
        const stack = [];
        // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be null
        const walker = document.createTreeWalker(element.content, 133 /* NodeFilter.SHOW_{ELEMENT|COMMENT|TEXT} */, null, false);
        // Keeps track of the last index associated with a part. We try to delete
        // unnecessary nodes, but we never want to associate two different parts
        // to the same index. They must have a constant node between.
        let lastPartIndex = 0;
        let index = -1;
        let partIndex = 0;
        const { strings, values: { length } } = result;
        while (partIndex < length) {
            const node = walker.nextNode();
            if (node === null) {
                // We've exhausted the content inside a nested template element.
                // Because we still have parts (the outer for-loop), we know:
                // - There is a template in the stack
                // - The walker will find a nextNode outside the template
                walker.currentNode = stack.pop();
                continue;
            }
            index++;
            if (node.nodeType === 1 /* Node.ELEMENT_NODE */) {
                if (node.hasAttributes()) {
                    const attributes = node.attributes;
                    const { length } = attributes;
                    // Per
                    // https://developer.mozilla.org/en-US/docs/Web/API/NamedNodeMap,
                    // attributes are not guaranteed to be returned in document order.
                    // In particular, Edge/IE can return them out of order, so we cannot
                    // assume a correspondence between part index and attribute index.
                    let count = 0;
                    for (let i = 0; i < length; i++) {
                        if (endsWith(attributes[i].name, boundAttributeSuffix)) {
                            count++;
                        }
                    }
                    while (count-- > 0) {
                        // Get the template literal section leading up to the first
                        // expression in this attribute
                        const stringForPart = strings[partIndex];
                        // Find the attribute name
                        const name = lastAttributeNameRegex.exec(stringForPart)[2];
                        // Find the corresponding attribute
                        // All bound attributes have had a suffix added in
                        // TemplateResult#getHTML to opt out of special attribute
                        // handling. To look up the attribute value we also need to add
                        // the suffix.
                        const attributeLookupName = name.toLowerCase() + boundAttributeSuffix;
                        const attributeValue = node.getAttribute(attributeLookupName);
                        node.removeAttribute(attributeLookupName);
                        const statics = attributeValue.split(markerRegex);
                        this.parts.push({ type: 'attribute', index, name, strings: statics });
                        partIndex += statics.length - 1;
                    }
                }
                if (node.tagName === 'TEMPLATE') {
                    stack.push(node);
                    walker.currentNode = node.content;
                }
            }
            else if (node.nodeType === 3 /* Node.TEXT_NODE */) {
                const data = node.data;
                if (data.indexOf(marker) >= 0) {
                    const parent = node.parentNode;
                    const strings = data.split(markerRegex);
                    const lastIndex = strings.length - 1;
                    // Generate a new text node for each literal section
                    // These nodes are also used as the markers for node parts
                    for (let i = 0; i < lastIndex; i++) {
                        let insert;
                        let s = strings[i];
                        if (s === '') {
                            insert = createMarker();
                        }
                        else {
                            const match = lastAttributeNameRegex.exec(s);
                            if (match !== null && endsWith(match[2], boundAttributeSuffix)) {
                                s = s.slice(0, match.index) + match[1] +
                                    match[2].slice(0, -boundAttributeSuffix.length) + match[3];
                            }
                            insert = document.createTextNode(s);
                        }
                        parent.insertBefore(insert, node);
                        this.parts.push({ type: 'node', index: ++index });
                    }
                    // If there's no text, we must insert a comment to mark our place.
                    // Else, we can trust it will stick around after cloning.
                    if (strings[lastIndex] === '') {
                        parent.insertBefore(createMarker(), node);
                        nodesToRemove.push(node);
                    }
                    else {
                        node.data = strings[lastIndex];
                    }
                    // We have a part for each match found
                    partIndex += lastIndex;
                }
            }
            else if (node.nodeType === 8 /* Node.COMMENT_NODE */) {
                if (node.data === marker) {
                    const parent = node.parentNode;
                    // Add a new marker node to be the startNode of the Part if any of
                    // the following are true:
                    //  * We don't have a previousSibling
                    //  * The previousSibling is already the start of a previous part
                    if (node.previousSibling === null || index === lastPartIndex) {
                        index++;
                        parent.insertBefore(createMarker(), node);
                    }
                    lastPartIndex = index;
                    this.parts.push({ type: 'node', index });
                    // If we don't have a nextSibling, keep this node so we have an end.
                    // Else, we can remove it to save future costs.
                    if (node.nextSibling === null) {
                        node.data = '';
                    }
                    else {
                        nodesToRemove.push(node);
                        index--;
                    }
                    partIndex++;
                }
                else {
                    let i = -1;
                    while ((i = node.data.indexOf(marker, i + 1)) !== -1) {
                        // Comment node has a binding marker inside, make an inactive part
                        // The binding won't work, but subsequent bindings will
                        // TODO (justinfagnani): consider whether it's even worth it to
                        // make bindings in comments work
                        this.parts.push({ type: 'node', index: -1 });
                        partIndex++;
                    }
                }
            }
        }
        // Remove text binding nodes after the walk to not disturb the TreeWalker
        for (const n of nodesToRemove) {
            n.parentNode.removeChild(n);
        }
    }
}
const endsWith = (str, suffix) => {
    const index = str.length - suffix.length;
    return index >= 0 && str.slice(index) === suffix;
};
const isTemplatePartActive = (part) => part.index !== -1;
// Allows `document.createComment('')` to be renamed for a
// small manual size-savings.
const createMarker = () => document.createComment('');
/**
 * This regex extracts the attribute name preceding an attribute-position
 * expression. It does this by matching the syntax allowed for attributes
 * against the string literal directly preceding the expression, assuming that
 * the expression is in an attribute-value position.
 *
 * See attributes in the HTML spec:
 * https://www.w3.org/TR/html5/syntax.html#elements-attributes
 *
 * " \x09\x0a\x0c\x0d" are HTML space characters:
 * https://www.w3.org/TR/html5/infrastructure.html#space-characters
 *
 * "\0-\x1F\x7F-\x9F" are Unicode control characters, which includes every
 * space character except " ".
 *
 * So an attribute is:
 *  * The name: any character except a control character, space character, ('),
 *    ("), ">", "=", or "/"
 *  * Followed by zero or more space characters
 *  * Followed by "="
 *  * Followed by zero or more space characters
 *  * Followed by:
 *    * Any character except space, ('), ("), "<", ">", "=", (`), or
 *    * (") then any non-("), or
 *    * (') then any non-(')
 */
const lastAttributeNameRegex = 
// eslint-disable-next-line no-control-regex
/([ \x09\x0a\x0c\x0d])([^\0-\x1F\x7F-\x9F "'>=/]+)([ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d]*(?:[^ \x09\x0a\x0c\x0d"'`<>=]*|"[^"]*|'[^']*))$/;

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * An instance of a `Template` that can be attached to the DOM and updated
 * with new values.
 */
class TemplateInstance {
    constructor(template, processor, options) {
        this.__parts = [];
        this.template = template;
        this.processor = processor;
        this.options = options;
    }
    update(values) {
        let i = 0;
        for (const part of this.__parts) {
            if (part !== undefined) {
                part.setValue(values[i]);
            }
            i++;
        }
        for (const part of this.__parts) {
            if (part !== undefined) {
                part.commit();
            }
        }
    }
    _clone() {
        // There are a number of steps in the lifecycle of a template instance's
        // DOM fragment:
        //  1. Clone - create the instance fragment
        //  2. Adopt - adopt into the main document
        //  3. Process - find part markers and create parts
        //  4. Upgrade - upgrade custom elements
        //  5. Update - set node, attribute, property, etc., values
        //  6. Connect - connect to the document. Optional and outside of this
        //     method.
        //
        // We have a few constraints on the ordering of these steps:
        //  * We need to upgrade before updating, so that property values will pass
        //    through any property setters.
        //  * We would like to process before upgrading so that we're sure that the
        //    cloned fragment is inert and not disturbed by self-modifying DOM.
        //  * We want custom elements to upgrade even in disconnected fragments.
        //
        // Given these constraints, with full custom elements support we would
        // prefer the order: Clone, Process, Adopt, Upgrade, Update, Connect
        //
        // But Safari does not implement CustomElementRegistry#upgrade, so we
        // can not implement that order and still have upgrade-before-update and
        // upgrade disconnected fragments. So we instead sacrifice the
        // process-before-upgrade constraint, since in Custom Elements v1 elements
        // must not modify their light DOM in the constructor. We still have issues
        // when co-existing with CEv0 elements like Polymer 1, and with polyfills
        // that don't strictly adhere to the no-modification rule because shadow
        // DOM, which may be created in the constructor, is emulated by being placed
        // in the light DOM.
        //
        // The resulting order is on native is: Clone, Adopt, Upgrade, Process,
        // Update, Connect. document.importNode() performs Clone, Adopt, and Upgrade
        // in one step.
        //
        // The Custom Elements v1 polyfill supports upgrade(), so the order when
        // polyfilled is the more ideal: Clone, Process, Adopt, Upgrade, Update,
        // Connect.
        const fragment = isCEPolyfill ?
            this.template.element.content.cloneNode(true) :
            document.importNode(this.template.element.content, true);
        const stack = [];
        const parts = this.template.parts;
        // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be null
        const walker = document.createTreeWalker(fragment, 133 /* NodeFilter.SHOW_{ELEMENT|COMMENT|TEXT} */, null, false);
        let partIndex = 0;
        let nodeIndex = 0;
        let part;
        let node = walker.nextNode();
        // Loop through all the nodes and parts of a template
        while (partIndex < parts.length) {
            part = parts[partIndex];
            if (!isTemplatePartActive(part)) {
                this.__parts.push(undefined);
                partIndex++;
                continue;
            }
            // Progress the tree walker until we find our next part's node.
            // Note that multiple parts may share the same node (attribute parts
            // on a single element), so this loop may not run at all.
            while (nodeIndex < part.index) {
                nodeIndex++;
                if (node.nodeName === 'TEMPLATE') {
                    stack.push(node);
                    walker.currentNode = node.content;
                }
                if ((node = walker.nextNode()) === null) {
                    // We've exhausted the content inside a nested template element.
                    // Because we still have parts (the outer for-loop), we know:
                    // - There is a template in the stack
                    // - The walker will find a nextNode outside the template
                    walker.currentNode = stack.pop();
                    node = walker.nextNode();
                }
            }
            // We've arrived at our part's node.
            if (part.type === 'node') {
                const part = this.processor.handleTextExpression(this.options);
                part.insertAfterNode(node.previousSibling);
                this.__parts.push(part);
            }
            else {
                this.__parts.push(...this.processor.handleAttributeExpressions(node, part.name, part.strings, this.options));
            }
            partIndex++;
        }
        if (isCEPolyfill) {
            document.adoptNode(fragment);
            customElements.upgrade(fragment);
        }
        return fragment;
    }
}

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * Our TrustedTypePolicy for HTML which is declared using the html template
 * tag function.
 *
 * That HTML is a developer-authored constant, and is parsed with innerHTML
 * before any untrusted expressions have been mixed in. Therefor it is
 * considered safe by construction.
 */
const policy = window.trustedTypes &&
    trustedTypes.createPolicy('lit-html', { createHTML: (s) => s });
const commentMarker = ` ${marker} `;
/**
 * The return type of `html`, which holds a Template and the values from
 * interpolated expressions.
 */
class TemplateResult {
    constructor(strings, values, type, processor) {
        this.strings = strings;
        this.values = values;
        this.type = type;
        this.processor = processor;
    }
    /**
     * Returns a string of HTML used to create a `<template>` element.
     */
    getHTML() {
        const l = this.strings.length - 1;
        let html = '';
        let isCommentBinding = false;
        for (let i = 0; i < l; i++) {
            const s = this.strings[i];
            // For each binding we want to determine the kind of marker to insert
            // into the template source before it's parsed by the browser's HTML
            // parser. The marker type is based on whether the expression is in an
            // attribute, text, or comment position.
            //   * For node-position bindings we insert a comment with the marker
            //     sentinel as its text content, like <!--{{lit-guid}}-->.
            //   * For attribute bindings we insert just the marker sentinel for the
            //     first binding, so that we support unquoted attribute bindings.
            //     Subsequent bindings can use a comment marker because multi-binding
            //     attributes must be quoted.
            //   * For comment bindings we insert just the marker sentinel so we don't
            //     close the comment.
            //
            // The following code scans the template source, but is *not* an HTML
            // parser. We don't need to track the tree structure of the HTML, only
            // whether a binding is inside a comment, and if not, if it appears to be
            // the first binding in an attribute.
            const commentOpen = s.lastIndexOf('<!--');
            // We're in comment position if we have a comment open with no following
            // comment close. Because <-- can appear in an attribute value there can
            // be false positives.
            isCommentBinding = (commentOpen > -1 || isCommentBinding) &&
                s.indexOf('-->', commentOpen + 1) === -1;
            // Check to see if we have an attribute-like sequence preceding the
            // expression. This can match "name=value" like structures in text,
            // comments, and attribute values, so there can be false-positives.
            const attributeMatch = lastAttributeNameRegex.exec(s);
            if (attributeMatch === null) {
                // We're only in this branch if we don't have a attribute-like
                // preceding sequence. For comments, this guards against unusual
                // attribute values like <div foo="<!--${'bar'}">. Cases like
                // <!-- foo=${'bar'}--> are handled correctly in the attribute branch
                // below.
                html += s + (isCommentBinding ? commentMarker : nodeMarker);
            }
            else {
                // For attributes we use just a marker sentinel, and also append a
                // $lit$ suffix to the name to opt-out of attribute-specific parsing
                // that IE and Edge do for style and certain SVG attributes.
                html += s.substr(0, attributeMatch.index) + attributeMatch[1] +
                    attributeMatch[2] + boundAttributeSuffix + attributeMatch[3] +
                    marker;
            }
        }
        html += this.strings[l];
        return html;
    }
    getTemplateElement() {
        const template = document.createElement('template');
        let value = this.getHTML();
        if (policy !== undefined) {
            // this is secure because `this.strings` is a TemplateStringsArray.
            // TODO: validate this when
            // https://github.com/tc39/proposal-array-is-template-object is
            // implemented.
            value = policy.createHTML(value);
        }
        template.innerHTML = value;
        return template;
    }
}
/**
 * A TemplateResult for SVG fragments.
 *
 * This class wraps HTML in an `<svg>` tag in order to parse its contents in the
 * SVG namespace, then modifies the template to remove the `<svg>` tag so that
 * clones only container the original fragment.
 */
class SVGTemplateResult extends TemplateResult {
    getHTML() {
        return `<svg>${super.getHTML()}</svg>`;
    }
    getTemplateElement() {
        const template = super.getTemplateElement();
        const content = template.content;
        const svgElement = content.firstChild;
        content.removeChild(svgElement);
        reparentNodes(content, svgElement.firstChild);
        return template;
    }
}

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const isPrimitive = (value) => {
    return (value === null ||
        !(typeof value === 'object' || typeof value === 'function'));
};
const isIterable = (value) => {
    return Array.isArray(value) ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        !!(value && value[Symbol.iterator]);
};
/**
 * Writes attribute values to the DOM for a group of AttributeParts bound to a
 * single attribute. The value is only set once even if there are multiple parts
 * for an attribute.
 */
class AttributeCommitter {
    constructor(element, name, strings) {
        this.dirty = true;
        this.element = element;
        this.name = name;
        this.strings = strings;
        this.parts = [];
        for (let i = 0; i < strings.length - 1; i++) {
            this.parts[i] = this._createPart();
        }
    }
    /**
     * Creates a single part. Override this to create a differnt type of part.
     */
    _createPart() {
        return new AttributePart(this);
    }
    _getValue() {
        const strings = this.strings;
        const l = strings.length - 1;
        const parts = this.parts;
        // If we're assigning an attribute via syntax like:
        //    attr="${foo}"  or  attr=${foo}
        // but not
        //    attr="${foo} ${bar}" or attr="${foo} baz"
        // then we don't want to coerce the attribute value into one long
        // string. Instead we want to just return the value itself directly,
        // so that sanitizeDOMValue can get the actual value rather than
        // String(value)
        // The exception is if v is an array, in which case we do want to smash
        // it together into a string without calling String() on the array.
        //
        // This also allows trusted values (when using TrustedTypes) being
        // assigned to DOM sinks without being stringified in the process.
        if (l === 1 && strings[0] === '' && strings[1] === '') {
            const v = parts[0].value;
            if (typeof v === 'symbol') {
                return String(v);
            }
            if (typeof v === 'string' || !isIterable(v)) {
                return v;
            }
        }
        let text = '';
        for (let i = 0; i < l; i++) {
            text += strings[i];
            const part = parts[i];
            if (part !== undefined) {
                const v = part.value;
                if (isPrimitive(v) || !isIterable(v)) {
                    text += typeof v === 'string' ? v : String(v);
                }
                else {
                    for (const t of v) {
                        text += typeof t === 'string' ? t : String(t);
                    }
                }
            }
        }
        text += strings[l];
        return text;
    }
    commit() {
        if (this.dirty) {
            this.dirty = false;
            this.element.setAttribute(this.name, this._getValue());
        }
    }
}
/**
 * A Part that controls all or part of an attribute value.
 */
class AttributePart {
    constructor(committer) {
        this.value = undefined;
        this.committer = committer;
    }
    setValue(value) {
        if (value !== noChange && (!isPrimitive(value) || value !== this.value)) {
            this.value = value;
            // If the value is a not a directive, dirty the committer so that it'll
            // call setAttribute. If the value is a directive, it'll dirty the
            // committer if it calls setValue().
            if (!isDirective(value)) {
                this.committer.dirty = true;
            }
        }
    }
    commit() {
        while (isDirective(this.value)) {
            const directive = this.value;
            this.value = noChange;
            directive(this);
        }
        if (this.value === noChange) {
            return;
        }
        this.committer.commit();
    }
}
/**
 * A Part that controls a location within a Node tree. Like a Range, NodePart
 * has start and end locations and can set and update the Nodes between those
 * locations.
 *
 * NodeParts support several value types: primitives, Nodes, TemplateResults,
 * as well as arrays and iterables of those types.
 */
class NodePart {
    constructor(options) {
        this.value = undefined;
        this.__pendingValue = undefined;
        this.options = options;
    }
    /**
     * Appends this part into a container.
     *
     * This part must be empty, as its contents are not automatically moved.
     */
    appendInto(container) {
        this.startNode = container.appendChild(createMarker());
        this.endNode = container.appendChild(createMarker());
    }
    /**
     * Inserts this part after the `ref` node (between `ref` and `ref`'s next
     * sibling). Both `ref` and its next sibling must be static, unchanging nodes
     * such as those that appear in a literal section of a template.
     *
     * This part must be empty, as its contents are not automatically moved.
     */
    insertAfterNode(ref) {
        this.startNode = ref;
        this.endNode = ref.nextSibling;
    }
    /**
     * Appends this part into a parent part.
     *
     * This part must be empty, as its contents are not automatically moved.
     */
    appendIntoPart(part) {
        part.__insert(this.startNode = createMarker());
        part.__insert(this.endNode = createMarker());
    }
    /**
     * Inserts this part after the `ref` part.
     *
     * This part must be empty, as its contents are not automatically moved.
     */
    insertAfterPart(ref) {
        ref.__insert(this.startNode = createMarker());
        this.endNode = ref.endNode;
        ref.endNode = this.startNode;
    }
    setValue(value) {
        this.__pendingValue = value;
    }
    commit() {
        if (this.startNode.parentNode === null) {
            return;
        }
        while (isDirective(this.__pendingValue)) {
            const directive = this.__pendingValue;
            this.__pendingValue = noChange;
            directive(this);
        }
        const value = this.__pendingValue;
        if (value === noChange) {
            return;
        }
        if (isPrimitive(value)) {
            if (value !== this.value) {
                this.__commitText(value);
            }
        }
        else if (value instanceof TemplateResult) {
            this.__commitTemplateResult(value);
        }
        else if (value instanceof Node) {
            this.__commitNode(value);
        }
        else if (isIterable(value)) {
            this.__commitIterable(value);
        }
        else if (value === nothing) {
            this.value = nothing;
            this.clear();
        }
        else {
            // Fallback, will render the string representation
            this.__commitText(value);
        }
    }
    __insert(node) {
        this.endNode.parentNode.insertBefore(node, this.endNode);
    }
    __commitNode(value) {
        if (this.value === value) {
            return;
        }
        this.clear();
        this.__insert(value);
        this.value = value;
    }
    __commitText(value) {
        const node = this.startNode.nextSibling;
        value = value == null ? '' : value;
        // If `value` isn't already a string, we explicitly convert it here in case
        // it can't be implicitly converted - i.e. it's a symbol.
        const valueAsString = typeof value === 'string' ? value : String(value);
        if (node === this.endNode.previousSibling &&
            node.nodeType === 3 /* Node.TEXT_NODE */) {
            // If we only have a single text node between the markers, we can just
            // set its value, rather than replacing it.
            // TODO(justinfagnani): Can we just check if this.value is primitive?
            node.data = valueAsString;
        }
        else {
            this.__commitNode(document.createTextNode(valueAsString));
        }
        this.value = value;
    }
    __commitTemplateResult(value) {
        const template = this.options.templateFactory(value);
        if (this.value instanceof TemplateInstance &&
            this.value.template === template) {
            this.value.update(value.values);
        }
        else {
            // Make sure we propagate the template processor from the TemplateResult
            // so that we use its syntax extension, etc. The template factory comes
            // from the render function options so that it can control template
            // caching and preprocessing.
            const instance = new TemplateInstance(template, value.processor, this.options);
            const fragment = instance._clone();
            instance.update(value.values);
            this.__commitNode(fragment);
            this.value = instance;
        }
    }
    __commitIterable(value) {
        // For an Iterable, we create a new InstancePart per item, then set its
        // value to the item. This is a little bit of overhead for every item in
        // an Iterable, but it lets us recurse easily and efficiently update Arrays
        // of TemplateResults that will be commonly returned from expressions like:
        // array.map((i) => html`${i}`), by reusing existing TemplateInstances.
        // If _value is an array, then the previous render was of an
        // iterable and _value will contain the NodeParts from the previous
        // render. If _value is not an array, clear this part and make a new
        // array for NodeParts.
        if (!Array.isArray(this.value)) {
            this.value = [];
            this.clear();
        }
        // Lets us keep track of how many items we stamped so we can clear leftover
        // items from a previous render
        const itemParts = this.value;
        let partIndex = 0;
        let itemPart;
        for (const item of value) {
            // Try to reuse an existing part
            itemPart = itemParts[partIndex];
            // If no existing part, create a new one
            if (itemPart === undefined) {
                itemPart = new NodePart(this.options);
                itemParts.push(itemPart);
                if (partIndex === 0) {
                    itemPart.appendIntoPart(this);
                }
                else {
                    itemPart.insertAfterPart(itemParts[partIndex - 1]);
                }
            }
            itemPart.setValue(item);
            itemPart.commit();
            partIndex++;
        }
        if (partIndex < itemParts.length) {
            // Truncate the parts array so _value reflects the current state
            itemParts.length = partIndex;
            this.clear(itemPart && itemPart.endNode);
        }
    }
    clear(startNode = this.startNode) {
        removeNodes(this.startNode.parentNode, startNode.nextSibling, this.endNode);
    }
}
/**
 * Implements a boolean attribute, roughly as defined in the HTML
 * specification.
 *
 * If the value is truthy, then the attribute is present with a value of
 * ''. If the value is falsey, the attribute is removed.
 */
class BooleanAttributePart {
    constructor(element, name, strings) {
        this.value = undefined;
        this.__pendingValue = undefined;
        if (strings.length !== 2 || strings[0] !== '' || strings[1] !== '') {
            throw new Error('Boolean attributes can only contain a single expression');
        }
        this.element = element;
        this.name = name;
        this.strings = strings;
    }
    setValue(value) {
        this.__pendingValue = value;
    }
    commit() {
        while (isDirective(this.__pendingValue)) {
            const directive = this.__pendingValue;
            this.__pendingValue = noChange;
            directive(this);
        }
        if (this.__pendingValue === noChange) {
            return;
        }
        const value = !!this.__pendingValue;
        if (this.value !== value) {
            if (value) {
                this.element.setAttribute(this.name, '');
            }
            else {
                this.element.removeAttribute(this.name);
            }
            this.value = value;
        }
        this.__pendingValue = noChange;
    }
}
/**
 * Sets attribute values for PropertyParts, so that the value is only set once
 * even if there are multiple parts for a property.
 *
 * If an expression controls the whole property value, then the value is simply
 * assigned to the property under control. If there are string literals or
 * multiple expressions, then the strings are expressions are interpolated into
 * a string first.
 */
class PropertyCommitter extends AttributeCommitter {
    constructor(element, name, strings) {
        super(element, name, strings);
        this.single =
            (strings.length === 2 && strings[0] === '' && strings[1] === '');
    }
    _createPart() {
        return new PropertyPart(this);
    }
    _getValue() {
        if (this.single) {
            return this.parts[0].value;
        }
        return super._getValue();
    }
    commit() {
        if (this.dirty) {
            this.dirty = false;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this.element[this.name] = this._getValue();
        }
    }
}
class PropertyPart extends AttributePart {
}
// Detect event listener options support. If the `capture` property is read
// from the options object, then options are supported. If not, then the third
// argument to add/removeEventListener is interpreted as the boolean capture
// value so we should only pass the `capture` property.
let eventOptionsSupported = false;
// Wrap into an IIFE because MS Edge <= v41 does not support having try/catch
// blocks right into the body of a module
(() => {
    try {
        const options = {
            get capture() {
                eventOptionsSupported = true;
                return false;
            }
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        window.addEventListener('test', options, options);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        window.removeEventListener('test', options, options);
    }
    catch (_e) {
        // event options not supported
    }
})();
class EventPart {
    constructor(element, eventName, eventContext) {
        this.value = undefined;
        this.__pendingValue = undefined;
        this.element = element;
        this.eventName = eventName;
        this.eventContext = eventContext;
        this.__boundHandleEvent = (e) => this.handleEvent(e);
    }
    setValue(value) {
        this.__pendingValue = value;
    }
    commit() {
        while (isDirective(this.__pendingValue)) {
            const directive = this.__pendingValue;
            this.__pendingValue = noChange;
            directive(this);
        }
        if (this.__pendingValue === noChange) {
            return;
        }
        const newListener = this.__pendingValue;
        const oldListener = this.value;
        const shouldRemoveListener = newListener == null ||
            oldListener != null &&
                (newListener.capture !== oldListener.capture ||
                    newListener.once !== oldListener.once ||
                    newListener.passive !== oldListener.passive);
        const shouldAddListener = newListener != null && (oldListener == null || shouldRemoveListener);
        if (shouldRemoveListener) {
            this.element.removeEventListener(this.eventName, this.__boundHandleEvent, this.__options);
        }
        if (shouldAddListener) {
            this.__options = getOptions(newListener);
            this.element.addEventListener(this.eventName, this.__boundHandleEvent, this.__options);
        }
        this.value = newListener;
        this.__pendingValue = noChange;
    }
    handleEvent(event) {
        if (typeof this.value === 'function') {
            this.value.call(this.eventContext || this.element, event);
        }
        else {
            this.value.handleEvent(event);
        }
    }
}
// We copy options because of the inconsistent behavior of browsers when reading
// the third argument of add/removeEventListener. IE11 doesn't support options
// at all. Chrome 41 only reads `capture` if the argument is an object.
const getOptions = (o) => o &&
    (eventOptionsSupported ?
        { capture: o.capture, passive: o.passive, once: o.once } :
        o.capture);

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * Creates Parts when a template is instantiated.
 */
class DefaultTemplateProcessor {
    /**
     * Create parts for an attribute-position binding, given the event, attribute
     * name, and string literals.
     *
     * @param element The element containing the binding
     * @param name  The attribute name
     * @param strings The string literals. There are always at least two strings,
     *   event for fully-controlled bindings with a single expression.
     */
    handleAttributeExpressions(element, name, strings, options) {
        const prefix = name[0];
        if (prefix === '.') {
            const committer = new PropertyCommitter(element, name.slice(1), strings);
            return committer.parts;
        }
        if (prefix === '@') {
            return [new EventPart(element, name.slice(1), options.eventContext)];
        }
        if (prefix === '?') {
            return [new BooleanAttributePart(element, name.slice(1), strings)];
        }
        const committer = new AttributeCommitter(element, name, strings);
        return committer.parts;
    }
    /**
     * Create parts for a text-position binding.
     * @param templateFactory
     */
    handleTextExpression(options) {
        return new NodePart(options);
    }
}
const defaultTemplateProcessor = new DefaultTemplateProcessor();

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * The default TemplateFactory which caches Templates keyed on
 * result.type and result.strings.
 */
function templateFactory(result) {
    let templateCache = templateCaches$1.get(result.type);
    if (templateCache === undefined) {
        templateCache = {
            stringsArray: new WeakMap(),
            keyString: new Map()
        };
        templateCaches$1.set(result.type, templateCache);
    }
    let template = templateCache.stringsArray.get(result.strings);
    if (template !== undefined) {
        return template;
    }
    // If the TemplateStringsArray is new, generate a key from the strings
    // This key is shared between all templates with identical content
    const key = result.strings.join(marker);
    // Check if we already have a Template for this key
    template = templateCache.keyString.get(key);
    if (template === undefined) {
        // If we have not seen this key before, create a new Template
        template = new Template(result, result.getTemplateElement());
        // Cache the Template for this key
        templateCache.keyString.set(key, template);
    }
    // Cache all future queries for this TemplateStringsArray
    templateCache.stringsArray.set(result.strings, template);
    return template;
}
const templateCaches$1 = new Map();

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const parts = new WeakMap();
/**
 * Renders a template result or other value to a container.
 *
 * To update a container with new values, reevaluate the template literal and
 * call `render` with the new result.
 *
 * @param result Any value renderable by NodePart - typically a TemplateResult
 *     created by evaluating a template tag like `html` or `svg`.
 * @param container A DOM parent to render to. The entire contents are either
 *     replaced, or efficiently updated if the same result type was previous
 *     rendered there.
 * @param options RenderOptions for the entire render tree rendered to this
 *     container. Render options must *not* change between renders to the same
 *     container, as those changes will not effect previously rendered DOM.
 */
const render = (result, container, options) => {
    let part = parts.get(container);
    if (part === undefined) {
        removeNodes(container, container.firstChild);
        parts.set(container, part = new NodePart(Object.assign({ templateFactory }, options)));
        part.appendInto(container);
    }
    part.setValue(result);
    part.commit();
};

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
// IMPORTANT: do not change the property name or the assignment expression.
// This line will be used in regexes to search for lit-html usage.
// TODO(justinfagnani): inject version number at build time
if (typeof window !== 'undefined') {
    (window['litHtmlVersions'] || (window['litHtmlVersions'] = [])).push('1.4.1');
}
/**
 * Interprets a template literal as an HTML template that can efficiently
 * render to and update a container.
 */
const html = (strings, ...values) => new TemplateResult(strings, values, 'html', defaultTemplateProcessor);
/**
 * Interprets a template literal as an SVG template that can efficiently
 * render to and update a container.
 */
const svg = (strings, ...values) => new SVGTemplateResult(strings, values, 'svg', defaultTemplateProcessor);

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
// For each part, remember the value that was last rendered to the part by the
// unsafeHTML directive, and the DocumentFragment that was last set as a value.
// The DocumentFragment is used as a unique key to check if the last value
// rendered to the part was with unsafeHTML. If not, we'll always re-render the
// value passed to unsafeHTML.
const previousValues$2 = new WeakMap();
/**
 * Renders the result as HTML, rather than text.
 *
 * Note, this is unsafe to use with any user-provided input that hasn't been
 * sanitized or escaped, as it may lead to cross-site-scripting
 * vulnerabilities.
 */
const unsafeHTML = directive((value) => (part) => {
    if (!(part instanceof NodePart)) {
        throw new Error('unsafeHTML can only be used in text bindings');
    }
    const previousValue = previousValues$2.get(part);
    if (previousValue !== undefined && isPrimitive(value) &&
        value === previousValue.value && part.value === previousValue.fragment) {
        return;
    }
    const template = document.createElement('template');
    template.innerHTML = value; // innerHTML casts to string internally
    const fragment = document.importNode(template.content, true);
    part.setValue(fragment);
    previousValues$2.set(part, { value, fragment });
});

/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const previousValues$1 = new WeakMap();
/**
 * For AttributeParts, sets the attribute if the value is defined and removes
 * the attribute if the value is undefined.
 *
 * For other part types, this directive is a no-op.
 */
const ifDefined = directive((value) => (part) => {
    const previousValue = previousValues$1.get(part);
    if (value === undefined && part instanceof AttributePart) {
        // If the value is undefined, remove the attribute, but only if the value
        // was previously defined.
        if (previousValue !== undefined || !previousValues$1.has(part)) {
            const name = part.committer.name;
            part.committer.element.removeAttribute(name);
        }
    }
    else if (value !== previousValue) {
        part.setValue(value);
    }
    previousValues$1.set(part, value);
});

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
// Helper functions for manipulating parts
// TODO(kschaaf): Refactor into Part API?
const createAndInsertPart = (containerPart, beforePart) => {
    const container = containerPart.startNode.parentNode;
    const beforeNode = beforePart === undefined ? containerPart.endNode :
        beforePart.startNode;
    const startNode = container.insertBefore(createMarker(), beforeNode);
    container.insertBefore(createMarker(), beforeNode);
    const newPart = new NodePart(containerPart.options);
    newPart.insertAfterNode(startNode);
    return newPart;
};
const updatePart = (part, value) => {
    part.setValue(value);
    part.commit();
    return part;
};
const insertPartBefore = (containerPart, part, ref) => {
    const container = containerPart.startNode.parentNode;
    const beforeNode = ref ? ref.startNode : containerPart.endNode;
    const endNode = part.endNode.nextSibling;
    if (endNode !== beforeNode) {
        reparentNodes(container, part.startNode, endNode, beforeNode);
    }
};
const removePart = (part) => {
    removeNodes(part.startNode.parentNode, part.startNode, part.endNode.nextSibling);
};
// Helper for generating a map of array item to its index over a subset
// of an array (used to lazily generate `newKeyToIndexMap` and
// `oldKeyToIndexMap`)
const generateMap = (list, start, end) => {
    const map = new Map();
    for (let i = start; i <= end; i++) {
        map.set(list[i], i);
    }
    return map;
};
// Stores previous ordered list of parts and map of key to index
const partListCache = new WeakMap();
const keyListCache = new WeakMap();
/**
 * A directive that repeats a series of values (usually `TemplateResults`)
 * generated from an iterable, and updates those items efficiently when the
 * iterable changes based on user-provided `keys` associated with each item.
 *
 * Note that if a `keyFn` is provided, strict key-to-DOM mapping is maintained,
 * meaning previous DOM for a given key is moved into the new position if
 * needed, and DOM will never be reused with values for different keys (new DOM
 * will always be created for new keys). This is generally the most efficient
 * way to use `repeat` since it performs minimum unnecessary work for insertions
 * and removals.
 *
 * IMPORTANT: If providing a `keyFn`, keys *must* be unique for all items in a
 * given call to `repeat`. The behavior when two or more items have the same key
 * is undefined.
 *
 * If no `keyFn` is provided, this directive will perform similar to mapping
 * items to values, and DOM will be reused against potentially different items.
 */
const repeat = directive((items, keyFnOrTemplate, template) => {
    let keyFn;
    if (template === undefined) {
        template = keyFnOrTemplate;
    }
    else if (keyFnOrTemplate !== undefined) {
        keyFn = keyFnOrTemplate;
    }
    return (containerPart) => {
        if (!(containerPart instanceof NodePart)) {
            throw new Error('repeat can only be used in text bindings');
        }
        // Old part & key lists are retrieved from the last update
        // (associated with the part for this instance of the directive)
        const oldParts = partListCache.get(containerPart) || [];
        const oldKeys = keyListCache.get(containerPart) || [];
        // New part list will be built up as we go (either reused from
        // old parts or created for new keys in this update). This is
        // saved in the above cache at the end of the update.
        const newParts = [];
        // New value list is eagerly generated from items along with a
        // parallel array indicating its key.
        const newValues = [];
        const newKeys = [];
        let index = 0;
        for (const item of items) {
            newKeys[index] = keyFn ? keyFn(item, index) : index;
            newValues[index] = template(item, index);
            index++;
        }
        // Maps from key to index for current and previous update; these
        // are generated lazily only when needed as a performance
        // optimization, since they are only required for multiple
        // non-contiguous changes in the list, which are less common.
        let newKeyToIndexMap;
        let oldKeyToIndexMap;
        // Head and tail pointers to old parts and new values
        let oldHead = 0;
        let oldTail = oldParts.length - 1;
        let newHead = 0;
        let newTail = newValues.length - 1;
        // Overview of O(n) reconciliation algorithm (general approach
        // based on ideas found in ivi, vue, snabbdom, etc.):
        //
        // * We start with the list of old parts and new values (and
        //   arrays of their respective keys), head/tail pointers into
        //   each, and we build up the new list of parts by updating
        //   (and when needed, moving) old parts or creating new ones.
        //   The initial scenario might look like this (for brevity of
        //   the diagrams, the numbers in the array reflect keys
        //   associated with the old parts or new values, although keys
        //   and parts/values are actually stored in parallel arrays
        //   indexed using the same head/tail pointers):
        //
        //      oldHead v                 v oldTail
        //   oldKeys:  [0, 1, 2, 3, 4, 5, 6]
        //   newParts: [ ,  ,  ,  ,  ,  ,  ]
        //   newKeys:  [0, 2, 1, 4, 3, 7, 6] <- reflects the user's new
        //                                      item order
        //      newHead ^                 ^ newTail
        //
        // * Iterate old & new lists from both sides, updating,
        //   swapping, or removing parts at the head/tail locations
        //   until neither head nor tail can move.
        //
        // * Example below: keys at head pointers match, so update old
        //   part 0 in-place (no need to move it) and record part 0 in
        //   the `newParts` list. The last thing we do is advance the
        //   `oldHead` and `newHead` pointers (will be reflected in the
        //   next diagram).
        //
        //      oldHead v                 v oldTail
        //   oldKeys:  [0, 1, 2, 3, 4, 5, 6]
        //   newParts: [0,  ,  ,  ,  ,  ,  ] <- heads matched: update 0
        //   newKeys:  [0, 2, 1, 4, 3, 7, 6]    and advance both oldHead
        //                                      & newHead
        //      newHead ^                 ^ newTail
        //
        // * Example below: head pointers don't match, but tail
        //   pointers do, so update part 6 in place (no need to move
        //   it), and record part 6 in the `newParts` list. Last,
        //   advance the `oldTail` and `oldHead` pointers.
        //
        //         oldHead v              v oldTail
        //   oldKeys:  [0, 1, 2, 3, 4, 5, 6]
        //   newParts: [0,  ,  ,  ,  ,  , 6] <- tails matched: update 6
        //   newKeys:  [0, 2, 1, 4, 3, 7, 6]    and advance both oldTail
        //                                      & newTail
        //         newHead ^              ^ newTail
        //
        // * If neither head nor tail match; next check if one of the
        //   old head/tail items was removed. We first need to generate
        //   the reverse map of new keys to index (`newKeyToIndexMap`),
        //   which is done once lazily as a performance optimization,
        //   since we only hit this case if multiple non-contiguous
        //   changes were made. Note that for contiguous removal
        //   anywhere in the list, the head and tails would advance
        //   from either end and pass each other before we get to this
        //   case and removals would be handled in the final while loop
        //   without needing to generate the map.
        //
        // * Example below: The key at `oldTail` was removed (no longer
        //   in the `newKeyToIndexMap`), so remove that part from the
        //   DOM and advance just the `oldTail` pointer.
        //
        //         oldHead v           v oldTail
        //   oldKeys:  [0, 1, 2, 3, 4, 5, 6]
        //   newParts: [0,  ,  ,  ,  ,  , 6] <- 5 not in new map: remove
        //   newKeys:  [0, 2, 1, 4, 3, 7, 6]    5 and advance oldTail
        //         newHead ^           ^ newTail
        //
        // * Once head and tail cannot move, any mismatches are due to
        //   either new or moved items; if a new key is in the previous
        //   "old key to old index" map, move the old part to the new
        //   location, otherwise create and insert a new part. Note
        //   that when moving an old part we null its position in the
        //   oldParts array if it lies between the head and tail so we
        //   know to skip it when the pointers get there.
        //
        // * Example below: neither head nor tail match, and neither
        //   were removed; so find the `newHead` key in the
        //   `oldKeyToIndexMap`, and move that old part's DOM into the
        //   next head position (before `oldParts[oldHead]`). Last,
        //   null the part in the `oldPart` array since it was
        //   somewhere in the remaining oldParts still to be scanned
        //   (between the head and tail pointers) so that we know to
        //   skip that old part on future iterations.
        //
        //         oldHead v        v oldTail
        //   oldKeys:  [0, 1, -, 3, 4, 5, 6]
        //   newParts: [0, 2,  ,  ,  ,  , 6] <- stuck: update & move 2
        //   newKeys:  [0, 2, 1, 4, 3, 7, 6]    into place and advance
        //                                      newHead
        //         newHead ^           ^ newTail
        //
        // * Note that for moves/insertions like the one above, a part
        //   inserted at the head pointer is inserted before the
        //   current `oldParts[oldHead]`, and a part inserted at the
        //   tail pointer is inserted before `newParts[newTail+1]`. The
        //   seeming asymmetry lies in the fact that new parts are
        //   moved into place outside in, so to the right of the head
        //   pointer are old parts, and to the right of the tail
        //   pointer are new parts.
        //
        // * We always restart back from the top of the algorithm,
        //   allowing matching and simple updates in place to
        //   continue...
        //
        // * Example below: the head pointers once again match, so
        //   simply update part 1 and record it in the `newParts`
        //   array.  Last, advance both head pointers.
        //
        //         oldHead v        v oldTail
        //   oldKeys:  [0, 1, -, 3, 4, 5, 6]
        //   newParts: [0, 2, 1,  ,  ,  , 6] <- heads matched: update 1
        //   newKeys:  [0, 2, 1, 4, 3, 7, 6]    and advance both oldHead
        //                                      & newHead
        //            newHead ^        ^ newTail
        //
        // * As mentioned above, items that were moved as a result of
        //   being stuck (the final else clause in the code below) are
        //   marked with null, so we always advance old pointers over
        //   these so we're comparing the next actual old value on
        //   either end.
        //
        // * Example below: `oldHead` is null (already placed in
        //   newParts), so advance `oldHead`.
        //
        //            oldHead v     v oldTail
        //   oldKeys:  [0, 1, -, 3, 4, 5, 6] <- old head already used:
        //   newParts: [0, 2, 1,  ,  ,  , 6]    advance oldHead
        //   newKeys:  [0, 2, 1, 4, 3, 7, 6]
        //               newHead ^     ^ newTail
        //
        // * Note it's not critical to mark old parts as null when they
        //   are moved from head to tail or tail to head, since they
        //   will be outside the pointer range and never visited again.
        //
        // * Example below: Here the old tail key matches the new head
        //   key, so the part at the `oldTail` position and move its
        //   DOM to the new head position (before `oldParts[oldHead]`).
        //   Last, advance `oldTail` and `newHead` pointers.
        //
        //               oldHead v  v oldTail
        //   oldKeys:  [0, 1, -, 3, 4, 5, 6]
        //   newParts: [0, 2, 1, 4,  ,  , 6] <- old tail matches new
        //   newKeys:  [0, 2, 1, 4, 3, 7, 6]   head: update & move 4,
        //                                     advance oldTail & newHead
        //               newHead ^     ^ newTail
        //
        // * Example below: Old and new head keys match, so update the
        //   old head part in place, and advance the `oldHead` and
        //   `newHead` pointers.
        //
        //               oldHead v oldTail
        //   oldKeys:  [0, 1, -, 3, 4, 5, 6]
        //   newParts: [0, 2, 1, 4, 3,   ,6] <- heads match: update 3
        //   newKeys:  [0, 2, 1, 4, 3, 7, 6]    and advance oldHead &
        //                                      newHead
        //                  newHead ^  ^ newTail
        //
        // * Once the new or old pointers move past each other then all
        //   we have left is additions (if old list exhausted) or
        //   removals (if new list exhausted). Those are handled in the
        //   final while loops at the end.
        //
        // * Example below: `oldHead` exceeded `oldTail`, so we're done
        //   with the main loop.  Create the remaining part and insert
        //   it at the new head position, and the update is complete.
        //
        //                   (oldHead > oldTail)
        //   oldKeys:  [0, 1, -, 3, 4, 5, 6]
        //   newParts: [0, 2, 1, 4, 3, 7 ,6] <- create and insert 7
        //   newKeys:  [0, 2, 1, 4, 3, 7, 6]
        //                     newHead ^ newTail
        //
        // * Note that the order of the if/else clauses is not
        //   important to the algorithm, as long as the null checks
        //   come first (to ensure we're always working on valid old
        //   parts) and that the final else clause comes last (since
        //   that's where the expensive moves occur). The order of
        //   remaining clauses is is just a simple guess at which cases
        //   will be most common.
        //
        // * TODO(kschaaf) Note, we could calculate the longest
        //   increasing subsequence (LIS) of old items in new position,
        //   and only move those not in the LIS set. However that costs
        //   O(nlogn) time and adds a bit more code, and only helps
        //   make rare types of mutations require fewer moves. The
        //   above handles removes, adds, reversal, swaps, and single
        //   moves of contiguous items in linear time, in the minimum
        //   number of moves. As the number of multiple moves where LIS
        //   might help approaches a random shuffle, the LIS
        //   optimization becomes less helpful, so it seems not worth
        //   the code at this point. Could reconsider if a compelling
        //   case arises.
        while (oldHead <= oldTail && newHead <= newTail) {
            if (oldParts[oldHead] === null) {
                // `null` means old part at head has already been used
                // below; skip
                oldHead++;
            }
            else if (oldParts[oldTail] === null) {
                // `null` means old part at tail has already been used
                // below; skip
                oldTail--;
            }
            else if (oldKeys[oldHead] === newKeys[newHead]) {
                // Old head matches new head; update in place
                newParts[newHead] =
                    updatePart(oldParts[oldHead], newValues[newHead]);
                oldHead++;
                newHead++;
            }
            else if (oldKeys[oldTail] === newKeys[newTail]) {
                // Old tail matches new tail; update in place
                newParts[newTail] =
                    updatePart(oldParts[oldTail], newValues[newTail]);
                oldTail--;
                newTail--;
            }
            else if (oldKeys[oldHead] === newKeys[newTail]) {
                // Old head matches new tail; update and move to new tail
                newParts[newTail] =
                    updatePart(oldParts[oldHead], newValues[newTail]);
                insertPartBefore(containerPart, oldParts[oldHead], newParts[newTail + 1]);
                oldHead++;
                newTail--;
            }
            else if (oldKeys[oldTail] === newKeys[newHead]) {
                // Old tail matches new head; update and move to new head
                newParts[newHead] =
                    updatePart(oldParts[oldTail], newValues[newHead]);
                insertPartBefore(containerPart, oldParts[oldTail], oldParts[oldHead]);
                oldTail--;
                newHead++;
            }
            else {
                if (newKeyToIndexMap === undefined) {
                    // Lazily generate key-to-index maps, used for removals &
                    // moves below
                    newKeyToIndexMap = generateMap(newKeys, newHead, newTail);
                    oldKeyToIndexMap = generateMap(oldKeys, oldHead, oldTail);
                }
                if (!newKeyToIndexMap.has(oldKeys[oldHead])) {
                    // Old head is no longer in new list; remove
                    removePart(oldParts[oldHead]);
                    oldHead++;
                }
                else if (!newKeyToIndexMap.has(oldKeys[oldTail])) {
                    // Old tail is no longer in new list; remove
                    removePart(oldParts[oldTail]);
                    oldTail--;
                }
                else {
                    // Any mismatches at this point are due to additions or
                    // moves; see if we have an old part we can reuse and move
                    // into place
                    const oldIndex = oldKeyToIndexMap.get(newKeys[newHead]);
                    const oldPart = oldIndex !== undefined ? oldParts[oldIndex] : null;
                    if (oldPart === null) {
                        // No old part for this value; create a new one and
                        // insert it
                        const newPart = createAndInsertPart(containerPart, oldParts[oldHead]);
                        updatePart(newPart, newValues[newHead]);
                        newParts[newHead] = newPart;
                    }
                    else {
                        // Reuse old part
                        newParts[newHead] =
                            updatePart(oldPart, newValues[newHead]);
                        insertPartBefore(containerPart, oldPart, oldParts[oldHead]);
                        // This marks the old part as having been used, so that
                        // it will be skipped in the first two checks above
                        oldParts[oldIndex] = null;
                    }
                    newHead++;
                }
            }
        }
        // Add parts for any remaining new values
        while (newHead <= newTail) {
            // For all remaining additions, we insert before last new
            // tail, since old pointers are no longer valid
            const newPart = createAndInsertPart(containerPart, newParts[newTail + 1]);
            updatePart(newPart, newValues[newHead]);
            newParts[newHead++] = newPart;
        }
        // Remove any remaining unused old parts
        while (oldHead <= oldTail) {
            const oldPart = oldParts[oldHead++];
            if (oldPart !== null) {
                removePart(oldPart);
            }
        }
        // Save order of new parts for next round
        partListCache.set(containerPart, newParts);
        keyListCache.set(containerPart, newKeys);
    };
});

/**
 * @license
 * Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * Checks binding values against live DOM values, instead of previously bound
 * values, when determining whether to update the value.
 *
 * This is useful for cases where the DOM value may change from outside of
 * lit-html, such as with a binding to an `<input>` element's `value` property,
 * a content editable elements text, or to a custom element that changes it's
 * own properties or attributes.
 *
 * In these cases if the DOM value changes, but the value set through lit-html
 * bindings hasn't, lit-html won't know to update the DOM value and will leave
 * it alone. If this is not what you want—if you want to overwrite the DOM
 * value with the bound value no matter what—use the `live()` directive:
 *
 *     html`<input .value=${live(x)}>`
 *
 * `live()` performs a strict equality check agains the live DOM value, and if
 * the new value is equal to the live value, does nothing. This means that
 * `live()` should not be used when the binding will cause a type conversion. If
 * you use `live()` with an attribute binding, make sure that only strings are
 * passed in, or the binding will update every render.
 */
const live = directive((value) => (part) => {
    let previousValue;
    if (part instanceof EventPart || part instanceof NodePart) {
        throw new Error('The `live` directive is not allowed on text or event bindings');
    }
    if (part instanceof BooleanAttributePart) {
        checkStrings(part.strings);
        previousValue = part.element.hasAttribute(part.name);
        // This is a hack needed because BooleanAttributePart doesn't have a
        // committer and does its own dirty checking after directives
        part.value = previousValue;
    }
    else {
        const { element, name, strings } = part.committer;
        checkStrings(strings);
        if (part instanceof PropertyPart) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            previousValue = element[name];
            if (previousValue === value) {
                return;
            }
        }
        else if (part instanceof AttributePart) {
            previousValue = element.getAttribute(name);
        }
        if (previousValue === String(value)) {
            return;
        }
    }
    part.setValue(value);
});
const checkStrings = (strings) => {
    if (strings.length !== 2 || strings[0] !== '' || strings[1] !== '') {
        throw new Error('`live` bindings can only contain a single expression');
    }
};

/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const previousValues = new WeakMap();
/**
 * Prevents re-render of a template function until a single value or an array of
 * values changes.
 *
 * Example:
 *
 * ```js
 * html`
 *   <div>
 *     ${guard([user.id, company.id], () => html`...`)}
 *   </div>
 * ```
 *
 * In this case, the template only renders if either `user.id` or `company.id`
 * changes.
 *
 * guard() is useful with immutable data patterns, by preventing expensive work
 * until data updates.
 *
 * Example:
 *
 * ```js
 * html`
 *   <div>
 *     ${guard([immutableItems], () => immutableItems.map(i => html`${i}`))}
 *   </div>
 * ```
 *
 * In this case, items are mapped over only when the array reference changes.
 *
 * @param value the value to check before re-rendering
 * @param f the template function
 */
const guard = directive((value, f) => (part) => {
    const previousValue = previousValues.get(part);
    if (Array.isArray(value)) {
        // Dirty-check arrays by item
        if (Array.isArray(previousValue) &&
            previousValue.length === value.length &&
            value.every((v, i) => v === previousValue[i])) {
            return;
        }
    }
    else if (previousValue === value &&
        (value !== undefined || previousValues.has(part))) {
        // Dirty-check non-arrays by identity
        return;
    }
    part.setValue(f());
    // Copy the value if it's an array so that if it's mutated we don't forget
    // what the previous values were.
    previousValues.set(part, Array.isArray(value) ? Array.from(value) : value);
});

/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const templateCaches = new WeakMap();
/**
 * Enables fast switching between multiple templates by caching the DOM nodes
 * and TemplateInstances produced by the templates.
 *
 * Example:
 *
 * ```
 * let checked = false;
 *
 * html`
 *   ${cache(checked ? html`input is checked` : html`input is not checked`)}
 * `
 * ```
 */
const cache = directive((value) => (part) => {
    if (!(part instanceof NodePart)) {
        throw new Error('cache can only be used in text bindings');
    }
    let templateCache = templateCaches.get(part);
    if (templateCache === undefined) {
        templateCache = new WeakMap();
        templateCaches.set(part, templateCache);
    }
    const previousValue = part.value;
    // First, can we update the current TemplateInstance, or do we need to move
    // the current nodes into the cache?
    if (previousValue instanceof TemplateInstance) {
        if (value instanceof TemplateResult &&
            previousValue.template === part.options.templateFactory(value)) {
            // Same Template, just trigger an update of the TemplateInstance
            part.setValue(value);
            return;
        }
        else {
            // Not the same Template, move the nodes from the DOM into the cache.
            let cachedTemplate = templateCache.get(previousValue.template);
            if (cachedTemplate === undefined) {
                cachedTemplate = {
                    instance: previousValue,
                    nodes: document.createDocumentFragment(),
                };
                templateCache.set(previousValue.template, cachedTemplate);
            }
            reparentNodes(cachedTemplate.nodes, part.startNode.nextSibling, part.endNode);
        }
    }
    // Next, can we reuse nodes from the cache?
    if (value instanceof TemplateResult) {
        const template = part.options.templateFactory(value);
        const cachedTemplate = templateCache.get(template);
        if (cachedTemplate !== undefined) {
            // Move nodes out of cache
            part.setValue(cachedTemplate.nodes);
            part.commit();
            // Set the Part value to the TemplateInstance so it'll update it.
            part.value = cachedTemplate.instance;
        }
    }
    part.setValue(value);
});

const is_mac = navigator.platform === 'MacIntel';
const is_iOS = /iPad|iPhone|iPod/.test( navigator.platform) ||
							 (is_mac && navigator.maxTouchPoints > 1);
const is_safari = /^((?!chrome|android).)*safari/i.test( navigator.userAgent);
const q = sel => document.querySelector( sel);
const clone = obj => JSON.parse( JSON.stringify( obj));
const ctor = target => Object.getPrototypeOf( target).constructor;
/** like toFixed but no rounding for the last digit, and works with string input. return a string from a number truncated to x decimal places */
function cleanNum( num, places=3){
	if( typeof num === 'string')
		num = parseFloat( num);
	return num.toFixed( places+1).slice(0,-1) /// remove last which is rounded
}
const isObject = o => !!o && typeof o === 'object' && ! Array.isArray( o);

const containsHTMLEntities = str => /&[\d\w]+;/.test( str);
// based on standard syntax: no space after '<' nor before '>' : <xxx> <xxx xxx="">
const containsHTMLElements = str => /\<\S.*?\S\>/.test( str);
const containsHTML = str => {
	// log('check', 'check if contains HTML:', str, '->', containsHTMLElements( str) || containsHTMLEnties( str))
	return containsHTMLElements( str) || containsHTMLEntities( str)
};

const loadStyleSheetAsync = href => new Promise( (resolve, reject) => {
	// console.warn('Load script:', src)
	let s = document.createElement('link');
	s.onerror = e => console.error('Error loading stylesheet:', href);
	s.onload = () => resolve( href);
	s.rel = 'stylesheet';
	document.head.appendChild( s);
	s.href = href;
});
/**
 * throttle: callback is called at a max speed during events
 * debounce: callback is only called after events have stopped
 * creates a debouced version of a function; Use for debouncing or throttling a rapid event callback
 * @param {function} callback The function to call back debouced / throttled
 * @param {number} [debounce_dly=1000] ms - callback is debounced (skipped) as long as events are fired within this delay.
 * @param {number} [throttle_dly=0] ms - if>0, callback will be triggered at this interval even if events are fired faster.
 * @param {bool} [initial_call=false] fire the callback once at start
 * @param {number} [precision=100] ms - period for checking elapsed time, no need to check as often as events...
 */
function debounce( callback, debounce_dly=1000, throttle_dly=0, initial_call=false, precision=100){

	let last_call = 0, onInterval_running = false, _params, initially_called = false, elapsed, t3, last_callback, now;
	//console.log('debounce:', debounce_dly)
	return function onCall( ...params){
		_params = params;
		now = Date.now();
		last_call = now;

		if( !onInterval_running){
			onInterval_running = true;
			last_callback = now; /// first time just use start time
			t3 = setInterval( onInterval, precision);
		}
	}
	/** periodically watch if elapsed time since last callback is > dly */
	function onInterval(){
		now = Date.now();
		elapsed = now - last_call;

		if( initial_call && !initially_called){
			initially_called = true;
			last_callback = now;
			callback( ..._params);
		}
		else if( elapsed > debounce_dly){ /// last callback was enough time ago
			onInterval_running = false;
			initially_called = false;
			last_callback = now;
			clearInterval( t3);
			//console.log('check', 'callback for debounce_dly')
			callback( ..._params);
		}
		else if( throttle_dly){
			if( now - last_callback > throttle_dly){
				last_callback = now;
				//console.log('check', 'callback for throttle_dly')
				callback( ..._params);
			}
		}
	}
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
/** -> await nextFrame() */
function nextFrame(){
  return new Promise( resolve => requestAnimationFrame( resolve))
}
const clamp = (num,min,max) => Math.max( Math.min( num, max), min);
/**
* Performs a deep merge of objects and returns new object. Does not modify
* objects (immutable) and merges arrays via concatenation.
*
* @param {...object} objects - Objects to merge
* @returns {object} New object with merged key/values
*/
function mergeDeep(...objects) {
  const isObject = obj => obj && typeof obj === 'object';

  return objects.reduce((prev, obj) => {
    Object.keys(obj).forEach(key => {
      const pVal = prev[key];
      const oVal = obj[key];

      if (Array.isArray(pVal) && Array.isArray(oVal)) {
        prev[key] = pVal.concat(...oVal);
      }
      else if (isObject(pVal) && isObject(oVal)) {
        prev[key] = mergeDeep(pVal, oVal);
      }
      else {
        prev[key] = oVal;
      }
    });

    return prev;
  }, {});
}

/*
export const loadScript = (src, async=false) => new Promise( (resolve, reject) => {
	// console.warn('Load script:', src)
	let s = document.createElement('script')
	s.onload = () => resolve( src)
	s.onerror = err => reject( err)
	s.async = async
	document.head.appendChild( s)
	s.src = src
})
export const loadScripts = urls =>  urls.forEach( url => loadScript( url))
 */

/// --- Vision Stage Framework --- ///

const VERSION = '1.0.0';

let config = {
	sw: null,
	paths: {
		components: '/_components/',
		icons: '/_assets/images/icons.svg',
		sounds: '/_assets/sounds/',
	},
	update_check_min: 30,
	font_size_decimals: 0,
	icons_mappings: {
		delete: 'trash',
		remove: 'cross',
		add: 'plus',
		// signs
		'+': 'plus',
		'x': 'cross'
	},
	icons_viewbox: {
		'double-chevron-right': '0 0 1024 1024',
		'arrow-right-rounded': '0 0 45.6 45.6',
		'fanion': '0 -11 100 120',
	},
	night_modes: [0,1], // CSS [night-mode='1|2'] styles are pre-defined
};
log('info','✦✦ Vision Stage ✦✦', VERSION, '(w/ lit-html 1.4.1)');


const stores = {};
const debug = { /* load:true */ };

// Will reference all components having an onResized method
// to call them after window is resized
const resize_watchers = new Set();

// keep track of the loaded ones, so we don't load the same component Class multiple times
const loaded_components = new Set();

let app, after_resize_timeout, aspect_ratios, active_sw, redundant;

/// Component base class ///
class Component extends HTMLElement {

	/**
	 * Callback; runs after component is rendered.
	 * @type {function}
	 */
	onRendered;

	/**
	 * Callback; runs after app is resized.
	 * @type {function}
	 */
	onResized;




	constructor(){
		// Note: this (Component ctor) runs *after* VisionStage (app) ctor
		super();
		if (this.localName === 'vision-stage'){
			app = this;
			this.id = 'app';
			this.languages = ctor(this).languages;
			const path = decodeURI( location.pathname);
			this.app_name =
			this.ns = path.slice(1,-1).replace(/\//g, '-') || 'home';
			// log('err', 'app_name (for props local storage key):', this.ns)
			initStore(this.ns);

			this.buildCSSForLangs();
		}
		this.#init();

		// default; changing app.lang updates ALL components
		// && this.strings ! some comp may use string from a .target
		if (this.localName !== 'vision-stage')
			this.uses([['vision-stage', 'lang']]);
	}

	connectedCallback(){ // VisionStage overrides this
		this.onConnected && this.onConnected();
	}

	#init(){
		const _ctor = ctor( this);
		this.is_component = true;
		this._state = {};

		let properties;
		if (_ctor.properties && _ctor._properties)
			properties = Object.assign( {}, _ctor._properties, _ctor.properties);
		else
			properties = _ctor.properties || _ctor._properties;

		// to array of [key,val]
		let flat_properties = properties ? Object.entries( properties) : [];

		for (let [prop, desc] of flat_properties) {

			if (!isObject( desc)) // wrap if primitive value
				desc = { value: desc };

			else if (desc.storable && !this.id){
				log('warn', 'trying to store:', prop, '...but no id on element (for store); ');
				// will use the tagName as the store key', '<'+this.tagName+'>','*** MAKE SURE THAT THIS ELEMENT IS ONLY USED ONCE ***')
				// throw Error('an element needs an id to be stored, tag:' + this.tagName)
			}
			let store_id = this.id;
			let ns = typeof desc.storable === 'string' ? desc.storable : this.ns;
			//log('err', 'Got ns:', ns, prop)
			let stored_val = store_id ? storedValue(ns, store_id, prop) : undefined;
			let use_value = stored_val !== undefined ? stored_val : desc.value;

			if (stored_val !== undefined){

				if (desc.delete_storable){
					saveStore(ns, store_id, prop, null, true);
				}
				else if (desc.storable /* && !this.params?.find(p=>p[0]===prop) */){
					//log('err', 'set stored value for prop:', prop, stored_val, this.params)
					this._state[prop] = stored_val;

					//! not sure it is needed here…
					if (typeof desc.storable === 'string' && !stores[ns]){
						//log('err', 'init global store:', ns, 'stored_val:', stored_val)
						initStore(ns);
					}
				}
				else //! DELETE / CLEAN UP
					saveStore(this.ns, store_id, prop, null, true);
			}
			else if (desc.storable){ // store initial value
				if (typeof desc.storable === 'string' && !stores[ns]){
					initStore(ns);
				}
				// log('err', 'Comp init; saveStore:', ns, store_id, prop, desc.value)
				saveStore(ns, store_id, prop, desc.value);
			}

			if (desc.sync_to_url_param)
				this.sync_props_to_params ||= true;

			if (desc.class)
				this.classList.toggle( desc.class, !!use_value);

			if (desc.attribute){ // ['open', 'bool']
				//! wait for ctor to finish, else attr will be set to prop initial value before we read initial attr value
				requestAnimationFrame( () => {

					if( typeof desc.attribute === 'string'){
						this.setAttribute( desc.attribute, use_value);
					}
					else { // Array
						let attr = desc.attribute[0];
						// remove if falsy value, otherwise set to empty value ("")
						if( desc.attribute[1] === 'bool'){
							if( !use_value) // falsy; remove
								this.removeAttribute( attr);
							else
								this.setAttribute( attr, '');
						}
						// set to a truthy value, otherwise remove
						else if( desc.attribute[1] === 'auto'){
							if( !use_value) // falsy; remove
								this.removeAttribute( attr);
							else
								this.setAttribute( attr, use_value);
						}
						else {
							throw 'Unknown attribute type'
						}
					}
				});
			}

			Object.defineProperty( this, prop, {
				get(){
					// log('info','GET', prop, '=>', this._state[ prop] )
					// can use a getter on desc for computed prop
					return desc.getter ? desc.getter.call( this, this._state[ prop]) : this._state[ prop]
				},
				set( val){ /// SET:
					// log('pink', 'SET prop:', this.id, prop, val)
					let store_id = this.id;
					if (desc.storable && !store_id)
						log('err', 'no store id for prop:', prop, this);

					if (prop in properties){ //// in? ==> is a reactive prop
						let no_render = false;
						let prev_val = this._state[prop];
						let t_val;
						if (desc.transformer && !this.bypass_transformer)
							t_val = desc.transformer.call( this, val, prev_val, desc.value, stored_val);

						let force_render = desc.force_render;

						// do not return -> WE MAY STILL NEED WATCHER FOR SIDE EFFECTS
						if (val===prev_val && !force_render || t_val === 'cancel' /* MAGIC WORD :| */)
							no_render = true;

						if (t_val !== undefined)
							val = t_val;

						if (desc.storable){
							// throttled_saveStores will only be fired once –
							// though it may be called again with different params...
							// like for rx and ry during a continuous dragging,
							// then only one of them would be stored in the end
							// so store value here directly on state and leave the global
							// localstorage saving the state for the throttled callback
							const ns = typeof desc.storable === 'string' ? desc.storable : this.ns;
							stores[ns][store_id] ||= {};
							stores[ns][store_id][prop] = val;

							// global store (will be called at least once after multiple set)
							throttled_saveStores();
							// setTimeout( e => saveStore(ns), 200)
						}

						this._state[prop] = val;

						if (!this.block_watcher)
							desc.watcher && desc.watcher.call( this, val, prev_val);

						if (desc.sync_to_url_param){
							// Update param - find param w/ name matching prop, sync it's val [1]
							// this prop may be global and app doesn't use or have params


							if (!this.params) {
								// build params
								this.params = [[prop,val]];
							}
							else if (desc.force_url_param) {
								// update params
								this.params[this.params.findIndex(p => p[0]===prop)][1] = val;
							}
							if (this.params){
								// Update hash
								let page = this.getPage().path.split('/')[0]; // remove possible params
								let hash = page + '/' +
									this.params.map( p => p.map(seg=>seg.toString()).join('=')).join('/');
								location.hash = hash;
							}
						}

						if( desc.attribute){ /// ['open', 'bool']
							if( typeof desc.attribute === 'string'){
								this.setAttribute( desc.attribute, val);
							}
							else { // Array
								let attr = desc.attribute[0];
								// remove if falsy value, otherwise set to empty value ("")
								if( desc.attribute[1] === 'bool'){
									if( !use_value) // falsy; remove
										this.removeAttribute( attr);
									else
										this.setAttribute( attr, '');
								}
								// set to a truthy value, otherwise remove
								else if( desc.attribute[1] === 'auto'){
									if( !val) // falsy; remove
										this.removeAttribute( attr);
									else
										this.setAttribute( attr, val);
								}
								else {
									throw 'Unknown attribute type'
								}
							}
						}

						if( desc.class)
							this.classList.toggle( desc.class, !!val);

						if( desc.reactive !== false && !no_render)
							this.render();


						//if( debug.renders && this.renders) log('err','this, renders:', prop, this.renders, this.renders.get( prop))

						// take care of dependencies ( this.uses([target,propA,propB]) )
						if( this.renders && this.renders.has( prop)){
							requestAnimationFrame( e => {
								for( let render_target of this.renders.get( prop)){
									if( debug.renders) log('check', 'prop, render target:', prop, render_target);
									render_target.render();
								}
							});
						}
					}
					else {
						log('err','NO own prop on this:', prop, properties);
					}
				}
			});

			if( desc.init_watcher===true){
				//! should not cause render; call manually
				// log('check', 'init_watcher true; prop:', prop)
				let prev_val = this._state[ prop];
				this._state[ prop] = use_value;
				desc.watcher && desc.watcher.call( this, use_value, prev_val);
			}
			else {
				// init "silently": no watcher/transformer etc...
				this._state[ prop] = use_value;
				if( desc.init_watcher==='onRendered'){
					this.setOnRendered = [prop, use_value];
				}
				else if( desc.init_watcher === 'deferred'){
					setTimeout( () => {
						this[ prop] = use_value;
					});
				}
			}
		}

		//! We should only clone once and store on another static prop...
		//! in case there's many instances...
		const strings = (_ctor.strings ? clone( _ctor.strings) : {});

		if( _ctor._strings)
			Object.assign( strings, _ctor._strings);

		// removed : attribute strings

		if( _ctor.strings){
			if( !app.languages)
				log('err', 'no app languages yet', this);

			this.strings = strings;

			// this.$name -> getters for strings
			for( let name in strings){
				Object.defineProperty( this, '$'+name, {
					get(){ return this.getString( name) },
					set(){ throw 'cannot set a string' }
				});
			}
		}

		if( this.onResized && !resize_watchers.has( this)){
			resize_watchers.add( this);
			//log('check', 'resize_watchers	:', resize_watchers)
		}

		if( _ctor.attributes){
			for( let attr of _ctor.attributes){
				this[ attr] = this.getAttribute( attr);
			}
		}

		if( _ctor.sounds)
			app.sounds_list = _ctor.sounds;
	}

	/**
	 * Declares that a component uses one or more props from another component
	 * and must also be rendered when this other component's prop changes.
	 */
	uses( entries){
		//log('pink', 'this, uses:', this, entries)
		//
		// -> for each target:  target.renders = Map([['prop1', Set.add(this)],[prop2, Set.add(this)]])
		// 											app.renders = Map([['lang', ADD this]])
		for( let entry of entries){
			/// non destructive...
			let prop_holder = entry[0];
			let props = entry.slice(1); /// copy the rest
			// if( props.length > 1) /// 1 => only lang
			//! @TODO only `uses` lang when a comp actually uses lang ?
			//! -> check for: 1. [lang] attr and 2. strings is not empty
			if( debug.uses && props.length){
				log('info', '<'+(this.id||this.tagName+'::'+this.className)+'>', 'will render when any of [',...props,'] on', '<'+prop_holder+'>', 'is set');
			}

			if( typeof prop_holder === 'string'){
				let prop_holder_selector = prop_holder;
				prop_holder = q( prop_holder_selector);
				if( !prop_holder)
					throw 'uses(); prop_holder do not exist (yet?): ' + prop_holder_selector
					//debugger
			}
			if( !prop_holder) {
				log('err', 'no prop holder, entry:', entry);
				log('info', '<'+(this.id||this.tagName+'::'+this.className)+'>', 'will render when any of [',...props,'] on', '<'+prop_holder+'>', 'is set');
				debugger
			}
			prop_holder.renders = prop_holder.renders || new Map();

			for( let prop of props){
				if( prop_holder.renders.has( prop)) /// value exist (Set of render targets)
					prop_holder.renders.get( prop).add( this);
				else
					prop_holder.renders.set( prop, new Set([this]));
			}
		}
	}

	/** sets the state without triggering render or watcher/transformer */
	setState( name, value){ this._state[ name] = value; }

	/** set an attribute and render this */
	setAttr( name, value){
		this.setAttribute( name, value);
		this.render();
	}

	/**
	 * Component render function
	 * @param evt_ctx {Component} We may use another component as the events context (so `this` will refer to this other component instead of the one where the handler is defined).
	 */
	async render( evt_ctx){

		if( !this.template){
			if( this.localName !== 'vision-stage')
				log('warn', '--no template, cannot render(): '+ this.id +', '+ this.tagName);
			return
		}

		const debugging = debug.render===true ||
			Array.isArray( debug.render) && debug.render.includes( this.id||this.classList[0]);

		if( !this.needsRender){
			this.needsRender = true;
			// debugging && log('warn', 'needsd render:', this.id)

			await nextFrame();

			!this.rendered && this.beforeFirstRender && this.beforeFirstRender();

			if( this.beforeRender && this.beforeRender()===false){
				log('err', 'Aborted render for:', this.id);
				return
			}

			this.needsRender = false;
			const tmpl = this.template();
			//! => we might return null if something is missing for rendering the template
			if( !tmpl){ // === null){
				if( debugging)
					log('err', '--tmpl: no value -> no render', this.id, this.tagName);
				return
			}

			if( debugging)
				log('gold','--GOT TMPL, RENDER ', (this.id||this.classList[0]));

			// log('warn', 'eventContext: this:', this)
			// log('info', 'rendering…', this.id || this.tagName)
			render( tmpl, this, {
				scopeName: this.localName,
				eventContext: evt_ctx || this.event_context || this
			});

			const has_been_rendered = this.rendered;
			this.rendered = true; //! BEFORE CALLBACK TO PREVENT IFINITE LOOP
			if( !has_been_rendered){
				this._onFirstRendered && this._onFirstRendered();
				this.onFirstRendered && this.onFirstRendered();
				if( this.skipped_onResized){
					this.skipped_onResized = false;
					this.onResized( ...this.skipped_params);
					this.skipped_params = null;
				}
				//-- delete this.onFirstRendered
				// -> it's supposedly better not to delete anything after an object definition
			}
			this._onRendered && this._onRendered();
			this.onRendered && this.onRendered();
			if( this.setOnRendered){
				let [prop,val] = this.setOnRendered;
				this[ prop] = val;
				this.setOnRendered = null;
			}
		}
		else if( debugging)
			log('gold','already needsRender, waiting:', (this.id||this.classList[0]));
	}

	/**
	 * this.querySelector shorthand.
	 * @param sel {string} CSS selector string
	 * @return {Array<HTMLElement>}
	 */
	q( sel){
		return this.querySelector( sel)
	}

	/**
	 * this.querySelectorAll shorthand – Query elements and transform to an array.
	 * @param sel {string} CSS selector string
	 * @return {HTMLElement}
	 */
	qAll( sel){
		return Array.from( this.querySelectorAll( sel))
	}

	/**
	 * Method automatically called by generated string getters using the syntax: this.$welcome
	 * ! warning: will return result of unsafeHTML if contains HTML (looks for <tag> or HTML entity),
	 * ! use raw=true argument if we need the raw HTML string to use outside a lit-html template,
	 * ! like in a prop binding: <div .html_str=${ getString(…) } or when directly setting .innerHTML
	 * @param str_name {string} The name for the requested string.
	 * @param raw {bool} If we should return the raw string for a string containing HTML instead of the result of unsafeHTML.
	 * @return the string corresponding to the actual language
	 */
	getString( str_name, raw=false){
		if( !str_name) return ''
		if( !this.strings[ str_name]){
			log('warn','NO STRING FOUND FOR:', str_name);
			return ''
		}
		let lang = (app || this).lang;
		let lang_index = this.languages.indexOf( lang);
		let str = this.strings[ str_name][ lang_index] || this.strings[ str_name][0];
		return raw ? str : // force 'as is' even if contains html
			containsHTML( str) ? unsafeHTML( str) : // detected html
			str.startsWith('>') ? unsafeHTML( str.slice(1)) : // explicit html
			str // as is
	}

	/** Toggle between two classes based on a condition */
	switchClasses( a, b, condition){
		this.classList.toggle(a, condition);
		this.classList.toggle(b, !condition);
	}

	/**
	 * Returns an array from an attribute value consisting of
	 * space or comma (w/ possible spaces around) separated strings.
	 * @param name {string} Name of the attribute whose value is to parse.
	 * @param alt {string} A possible alternate attribute name if first is not declared.
	 * @return {array<string>}
	 */
	getAttributeList( name, alt){
		// log('pink', 'attr list from:', name)
		return (this.getAttribute( name)||this.getAttribute( alt)).split(/\s*[,\s]\s*/)
	}

	/**
	 * Returns an array for a string consisting of
	 * space or comma (w/ possible spaces around) separated strings.
	 * @param str {string} The string to parse.
	 * @return {array<string>}
	 */
	getStringList( str){
		return str.split(/\s*[,\s]\s*/)
	}

	/**
	 * Load a component JS and CSS files dynamically,
	 * either from the `/_components/` dir if bare path,
	 * or relative to app dir if path starts with `./`
	 * or absolutely if path starts with `/`
	 * @param file_path {string} Path for component
	 * @return {Promise<ModuleNamespaceObject>} an object that describes all exports from a module
	 */
	static async load( file_path){
		// log('err', 'config.paths.components:', config.paths.components)
		if (debug.load)
			log('ok','load() file_path:', file_path);

		// first check if already loaded
		if (loaded_components.has(file_path)){
			//log('info', 'component already loaded:', file_path)
			return
		}
		else
			loaded_components.add(file_path);

		/*if( scripts){
			scripts = scripts.split(/\s*,?\s/)
				.map( src => loadScriptAsync( src.includes('/') ? src : `/scripts/${src}`))
			await Promise.all( scripts)
		}*/

		let js, css;
		if (Array.isArray( file_path)){
			js = file_path[0] + '.js';
			css = file_path[1] + '.css';
		}
		else if (file_path.endsWith('.js')){
			js = file_path;
		}
		else { // normal: extensionless => same for both
			js = file_path + '.js';
			css = file_path/* .replace('.min','') */ + '.css';
		}

		// if starts with ./ -> remove and use pathname, else assume is in /_components/
		// unless abs (/) -> then leave as is
		if (/^\./.test(css))
			css = location.pathname + css.replace(/^\.\//,''); // if starts with dot, remove it
		else if (css && ! /^\./.test(css))
			css = `${ config.paths.components }${ css }`;

		if (/^\./.test( js))
			js = location.pathname + js.replace(/^\.\//,''); // if starts with dot, remove it
		else
			js = `${ config.paths.components }${ js }`;

		//if (debug.load)
			log('purple', 'load js, css :', js, css);
		// make sure CSS is loaded before we import js so no flash of unstyled components
		css && await loadStyleSheetAsync( css);
		return import( js)
	}

	static loadAll( ...components){
		components = components.map( c => Component.load( c));
		return Promise.all( components)
	}
}

/// App Component ///
class VisionStage extends Component {

	/**
	 * callback;
	 */
	onCacheUpdated;

	constructor(){
		super();
		this.lang = this.lang; // trigger watcher now

		// -> disable right-clicking
		// this.addEventListener( 'contextmenu', e => e.preventDefault())

		this.is_iOS = is_iOS;
		this.scrolls = this.classList.contains('scroll');

		// Save store to localStorage on pagehide / unload
		if (!window.do_not_store){
			const termination_event = 'onpagehide' in self ? 'pagehide' : 'unload';
			window.addEventListener(termination_event, e => saveStores());
		}

		// auto filled by each component
		this.foldable_components = new Set();

		// add 'using-mouse' class which hides input outlines
		// fold all <vs-selector> components
		document.body.addEventListener('pointerdown', (e) => {

			document.body.classList.add('using-mouse');

			// means we clicked on a vs-selector component, leave it manage clicks
			if (e.target.closest('vs-selector[folds]'))
				return

			// else we clicked something else, close all <vs-selector>
			for (let sel_btn of this.foldable_components)
				if (!sel_btn.folded) sel_btn.folded = true;
		});

		// remove 'using-mouse' class which hides input outlines
		document.body.addEventListener('keydown', (e) => {
			if (!e.key) return // -> autofill
			document.body.classList.remove('using-mouse');
		});

		window.addEventListener('hashchange', this.#onHashChanged.bind( this));
		this.#updateAspect( ctor( this).aspects);

		this._onInstallable = this.#onInstallable.bind( this);
		this._onInstalled = this.#onInstalled.bind( this);

		window.addEventListener('beforeinstallprompt', this._onInstallable);
		window.addEventListener('appinstalled', () => this._onInstalled);
	}

	connectedCallback(){

		this.onConnected && this.onConnected();
		this.updateDocTitle();
		if (ctor(this).sounds)
			this.setupSounds(); // playSound( name), stopSound( name)

		if (config.sw){
			this.getActiveSW().then( SW => {
				active_sw = SW || null;
				this.registerSW();
			});
		}
	}

	updateDocTitle(){
		const title = this.$doc_title || this.$title;
		const page = this.getPage()?.title || decodeURI(location.hash.slice(1).split('/')[0]);
		const is_root = this.getPage()?.path === '';
		if (title && page && !is_root){
			const doc_title = title + ' ✦ ' + page;
			document.title = doc_title;
			//log('red', 'set doc title:', doc_title)
		}
		else if (title){
			document.title = title;
		}
		// else: keep the static title in index.html
	}

	async getActiveSW(){
		//log('check', 'getActiceSW()')
		if( 'serviceWorker' in navigator){
			const registrations = await navigator.serviceWorker.getRegistrations();
			for (let registration of registrations){
				// registration.unregister()
				return registration.active // only first, should not be more
			}
		}
	}

	async #onInstallable(e){
		// Prevent the mini-infobar from appearing on mobile
		e.preventDefault();
		// Stash the event so it can be triggered later.
		this.deferredPrompt = e;
		// Update UI notify the user they can install the PWA
		// ...showInstallPromotion()
		log('ok','App is installable');
		this.classList.add('installable'); /// use to show install shortcut/standalone button
	}

	#onInstalled(){
		log('ok', 'App installed');
		this.deferredPrompt = null;
		this.classList.remove('installable');
		// Note: app only mount once, thus classes can be managed procedurally
	}

	/** user want to "install" a shortcut, trigger native prompt */
	install(){
		if( !this.deferredPrompt){
			log('err','no deferredPrompt', this);
			return
		}

		this.deferredPrompt.prompt(); // native prompt
		// this.deferredPrompt.userChoice
		// 	.then( choiceResult => {
		// 		if( choiceResult.outcome === 'accepted')
		// 			// hides install section in menu
		// 			this.classList.remove('installable')
		// 		// else user dismissed prompt
		// 		this.deferredPrompt = null
		// 	})
	}

	#onHashChanged(){
		this.#setPageFromHash();

	}

	#setPageFromHash(){ // sets this.page name (coresp to [page] attribute)
		let h = decodeURI( location.hash.slice(1));
		if (!h){
			if( this.page !== ''){
				//log('err', 'set page empty')
				this.page = '';
			}
			this.updateDocTitle();
			return
		}
		// find corresp. path in pages to get key
		if( h.endsWith('/')) h = h.slice(0,-1);
		let [page, ...params] = h.split('/');
		// log('err', 'raw params:', params)

		this.params = !params.length ? null : params
			.map( p => p.split('='))
			.map( ([k,v]) => [k, v==='true'?true : v==='false'?false : !isNaN(v)?parseFloat(v) : v]);
		// log('pink', 'Got params from hash:', h, this.params)
		let page_name = '';
		//log('info', 'match page, in pages:', page, this.pages)
		outer:
		for (let [name, data] of this.pages){
			for (let lang in data){
				let path = data[ lang].path.split('/')[0];
				if (path === page){
					page_name = name;
					break outer
				}
			}
		}

		if (!page_name){ // unknown
			log('warn', 'unknown path:', h);
			this.page = '';
			return
		}

		this.page = page_name;
		this.updateDocTitle();
	}

	/**
	 * gets the page sub-object {title,path} for the current lang
	 */
	getPage (page_name=null){

		if (!this.pages){
			// log('warn', 'no pages yet')
			return null
		}
		let p_name = (page_name===null ? this.page : page_name);
		let page = this.pages.find( ([name]) => p_name === name);
		let lang = this.lang;
		if (page && !page[1][lang]){
			//log('warn', 'Missing string for page with current lang: ' + p_name + ' -> ' + lang, 'Using default lang (en).')
			lang = this.languages[0];
		}
		if (page && !page[1][lang])
			throw 'Missing string for page with default (en) lang: ' + p_name + ' -> ' + lang

		return page ? page[1][lang] : {} // [1] == data
	}

	getPageLink (page, postfix='', clss){
		if( !this.pages) return ''
		//log('check', 'page link:', page)
		const pre =
			!page ? '':
			page.startsWith('/') ? '/' : // abs path
			page.startsWith('./') ? '' : // rel path
			page.startsWith('http') ? '' :
			'#'; // bare path -> virtual page

		const p = this.getPage( page);
		// log('red', 'page obj:', p)
		let path = p.path;
		// log('red', 'link path:', path)
		if( pre === '/')
			path = page.slice(1);

		if (page === this.page)
			clss = clss ? clss+' '+'selected' : 'selected';

		const href = page ? pre + path : '#'; //: 'javascript: void(0)'
		// mark ext links
		const is_out = /^\.?\//.test(page); // rel/abs real links
		const is_ext = /^http/.test(page); // external link
		let target;
		if (is_ext) target = '_blank';

		return postfix ?
			html`
			<span flow='col' class='link'>
				<a class=${ ifDefined(clss) } href='${ href }' target=${ ifDefined(target) }>${ p.title }</a>
				<span class='marker ${is_ext?'ext':''}'>${ is_out ? ' →' : is_ext ? icon('ext-link') : null }</span>
			</span>
			<span class='nav-sep'>${ postfix }</span>
			`
			:
			html`
			<span flow='col' class='link'>
				<a class=${ ifDefined(clss) } href='${ href }' target=${ ifDefined(target) }>${ p.title }</a>
				<span class='marker ${is_ext?'ext':''}'>${ is_out ? ' →' : is_ext ? icon('ext-link') : null }</span>
			</span>`
	}

	_onFirstRendered(){

		const pages = ctor(this).pages;
		if (pages){
			// map each title to {title, path} (path is title with spaces replaced by -)
			this.pages = Object.entries(pages).map(([name, titles]) => {
				let path;
				// titles may be an object with titles and path
				if (isObject(titles)){
					path = titles.path;
					titles = titles.titles;
				}
				// real path (not a virual page (#)) -> use name for path, not title…
				else if (!name || /^(\.?\/|http)/.test(name)){ // name.startsWith('./') || name.startsWith('/')
					path = name;
				}
				let obj = {};
				let lang_index = 0;
				for (let title of titles){
					let lang = this.languages[ lang_index++];
					obj[ lang] = { title, path: path ?? title.replace(/\s/g, '-') };
				}
				return [name, obj]
			});
		}
		this.#setPageFromHash();
	}

	// Scrolled detection for setting different styles
	// onMainScroll(e){
	// 	this.classList.toggle('scrolled', main.scrollTop > 10)
	// }

	// delayed
	afterResize(){
		app.resizing = false;
		app.updateScrollbarClass();
	}

	_onRendered(){
		let main = this.q('#app-content');
		if( main) this.main = main;
		this.updateScrollbarClass();
	}

	//! Warning: this.main.scrollHeight > this.main.offsetHeight may be true even when no scrollbar
	//! some styles can mess this up ??
	/** sets .content-has-scrollbar for app-header/footer shadows */
	updateScrollbarClass(){
		// log('pink', 'update scrollbar class', this.main && this.main.classList.contains('scroll'), this.main.scrollHeight, '>', this.main.offsetHeight)
		if (this.main && this.main.classList.contains('scroll')){
			let has = this.main.scrollHeight > this.main.offsetHeight;
			this.classList.toggle('content-has-scrollbar', has);
			//if( has) log('check', 'main has scrollbar; scroll height, main height:', this.main.scrollHeight, this.main.offsetHeight)
		}
	}

	resize(){
		if (this.block_resize)
			return // mobile + menu auth open -> prevent resize by onscreen keyboard

		this.resizing = true;
		clearTimeout( after_resize_timeout);
		after_resize_timeout = setTimeout( this.afterResize, 200);

		if (this.is_mobile === undefined){
			this.is_mobile =
				Math.min(window.screen.width, window.screen.height) < 768 ||
				navigator.userAgent.indexOf("Mobi") > -1;

		}
		//this.is_standalone = window.matchMedia('(display-mode: standalone)').matches



		//tempClass( this, 'resizing', 1) //! tempClass doesn't reset its timeout...
		const threshold = aspect_ratios.threshold;
		const root = document.documentElement;
		const FSD = config.font_size_decimals;
		//log('check', 'FSD:', FSD)
		let w = window.innerWidth,
			 h = window.innerHeight;
		const AR = { now: parseFloat( cleanNum( w / h)), min: 0 };

		// true also if we specify only portrait
		const is_portrait = (aspect_ratios.portrait && AR.now < threshold) || !aspect_ratios.landscape;

		if (this.is_portrait !== is_portrait) // is reactive
			this.is_portrait = is_portrait;

		// defines what relative height we want (in rem)
		let height_rem = // aspect_ratios.height ||
			this.is_portrait
				? (aspect_ratios.portrait_height || aspect_ratios.height || 40)
				: (aspect_ratios.height || 40);
		// log('warn', 'rem height:', height_rem)
		if (this.is_portrait){
			AR.min = aspect_ratios.portrait_min;
			AR.base = aspect_ratios.portrait;
			AR.max = aspect_ratios.portrait_max;
			AR.tall = AR.base;
		}
		else {
			AR.min =
			AR.base = aspect_ratios.landscape||1.6;
			AR.max = aspect_ratios.landscape_max||11; 	// 0 = 11 => virtually no limit
			AR.wide = AR.base;
		}
		// log('pink', 'AR:', AR)

		let margin = 0,
			above_landscape_max = AR.now > AR.max,
			below_landscape = AR.now < AR.base;

		const cm = aspect_ratios.cross_margin;

		if (!this.is_mobile && !this.is_portrait)
			margin = (above_landscape_max || below_landscape) ? cm : 0;
		// just below threshold, above portrait max -> side "black bars"
		else if (!this.is_mobile && cm && AR.now > AR.max)
			margin = cm;

		this.setAttribute('orientation', this.is_portrait ? 'portrait' : 'landscape');
		let ar = AR.now;
		let asp =
			ar < aspect_ratios.portrait 		? 'portrait-min'	: // below portrait
			ar < aspect_ratios.portrait_max 	? 'portrait-mid'	: // between portrait & portrait_max
			ar < aspect_ratios.threshold 		? 'portrait-max'	: // between portrait_max & threshold
			ar < aspect_ratios.landscape 		? 'landscape-min'	: // between threshold & landscape
			ar < aspect_ratios.landscape_max ? 'landscape-mid'	: // between landscape and landscape_max
														  'landscape-max';	  // above landscape_max
		this.setAttribute('aspect-range', asp);

		if( typeof margin === 'string') // assumes %, implicit or explicit
			margin = parseFloat(margin) * h / 100;

		// Adjust size for margin
		if( AR.now > AR.max){
			if( margin)
				h -= (margin * 2);
			w = Math.floor( h * AR.max); // smallest of: window width or max AR
		}
		else if( AR.base && AR.now < AR.base){
			if( margin)
				w -= margin * 2;
			// if( this.margin)
			// 	h -= margin * 2
			// cap height (h) to base AR
			const MIN_AR = 1 / (AR.wide || AR.min);

			h = Math.floor( Math.min( w * MIN_AR, h)); // smallest of: window height (h) or base AR
		}
		// else if( this.margin){
		// 	w -= margin * 2
		// 	h -= margin * 2
		// }
		this.classList.toggle('has-margins', !!margin);

		this.sth = h;
		this.stw = w;
		this.AR = w/h;

		// limit stage's height based on portrait_min AR
		let base_h =
			!this.is_portrait ? h :
			Math.min(h, w * (1/AR.base));

		root.style.setProperty('--stw',w+'px');
		root.style.setProperty('--sth',h+'px');
		let fs = Math.floor( base_h / height_rem * 10**FSD) / 10**FSD;
		root.style.fontSize = fs + 'px';

		let alt = aspect_ratios.portrait_alt;
		let s = alt && this.AR < alt ?
			Math.min(h, w * (1/alt)) / height_rem :
			h / height_rem;

		let fs2 = Math.floor( s * 10**FSD) / 10**FSD;
		root.style.setProperty('--sth-based-fs', fs2 + 'px');
		// em to allow super-scaling (follow parent if it's scaled)
		root.style.setProperty('--sth-based-fs-em', fs2/fs + 'em');

		//log('err', 'base, h:', base_h, h)
		/// fs2 em should be the scale relative to normal fs?
		/// fs = h (1000) / height_rem (40) = 1em

		// log('warn', 'sth-based-fs:', h / height_rem)

		this.scaling = fs / 16;
		// root.style.setProperty('--scale', this.scaling)
		//log('purple', 'this.scale:', this.scale)
			// -> floor else we might overflow and get scrollbar
		//log('info', 'fontSize :', root.style.fontSize)
		// VALUE OF ONE REM IN PX (0.00)
		//this.REM = Math.round((base_h / height_rem) * 100) / 100

		// log('purple', 'resize() ->resize_watchers:', ...resize_watchers)
		for( let comp of resize_watchers){ // components with onResized method
			//log('check', 'call resize for comp?, rendered? :', comp.rendered, comp)
			if( comp.rendered){
				comp.onResized( AR, aspect_ratios);
			}
			else {
				//log('warn', 'skipped onResized', this)
				comp.skipped_onResized = true;
				comp.skipped_params = [AR,aspect_ratios];
			}
		}

		// calc progress between tall AR (0) and x-tall AR (1);
		// can be useful to adjust something progressively from one to the other AR
		const range = AR.base - AR.min; // ex: 0.1,  / 0.16 = 0.83333
		let xtra = null;
		if( this.is_portrait){
			// log('check', 'AR.base - AR.now) / range:', AR.base, AR.now, range, AR.min)
			xtra = (AR.base - AR.now) / range; // .66 - .6 = .06 over .16
			xtra = Math.max( 0, Math.min( 1, xtra));
			//log('info', '--extra (-tall progress):', xtra)
		}
		this.style.setProperty('--extra', !xtra ? 0 : xtra); //[0,1]
	}

	#updateAspect (ratios){
		// log('info', 'aspects:', ratios)
		if (!this.initial_ratios)
			this.initial_ratios = ratios;

		if (aspect_ratios)
			Object.assign(aspect_ratios, ratios);
		else
			aspect_ratios = ratios;

		if (aspect_ratios.portrait){
			if (!aspect_ratios.portrait_min)
				aspect_ratios.portrait_min = .01; // can't be 0...
			if (!aspect_ratios.portrait_max)
				aspect_ratios.portrait_max = aspect_ratios.portrait;
		}

		if (!aspect_ratios.threshold)
			aspect_ratios.threshold = 1;

		if (!aspect_ratios.cross_margin)
			aspect_ratios.cross_margin = 0;

		this.resize();
	}

	/**
	 * Build CSS to hide elements with a lang attribute not matching the app's
	 *
	 */
	buildCSSForLangs(){
		let str = '';
		for( let lang of this.languages)
			str += `vision-stage[lang='${lang}'] [lang]:not([lang='${lang}']) { display: none !important }\n`;
		const stylesheet = document.createElement('style');
		stylesheet.textContent = str;
	  document.head.appendChild( stylesheet);
	}

	// must be called from the app after user event, or onConnected but then the first time it won't play on iOS (?still true?)
	/**
	 * Basic audio playback with Web Audio. No lib! ;)
	 * the main limitation is that the volume, althought it can be adjusted by individual sounds, is global, so if two sounds with different volume option||default are overlapping, the volume will sharply change; the ideal is to have sounds prerendered at the right volume. This does not concern this.global_volume which is another layer (a fract. multiplier) that the user can adjust.
	 * Sounds are fetched and stored: this.sounds[ name] = { audio_buffer, options }
	 * @return {Promise}
	 */
	setupSounds (){
		log('info', 'setupSounds');
		let sounds_data = ctor( this).sounds;
		if( !sounds_data)
			return

		sounds_data = Object.entries(sounds_data).map(
			([name, value]) =>  typeof value === 'string' ? [name, value] : [name, ...value ]);
		//log('info', 'sounds_data:', sounds_data)
		this.sounds = {};
		window.AudioContext = window.AudioContext || window.webkitAudioContext;
		this.audio_context = new window.AudioContext();
		this.gain_node = this.audio_context.createGain(); // global volume control

		const getFilePath = file => /^\.?\//.test(file) ? file : config.paths.sounds + file;

		//! more verbose, eventually delete...
		if( is_iOS || is_safari)
			return Promise.all(
				sounds_data.map( ([name, file, options={}]) => fetch( getFilePath(file))
					.then( response => response.arrayBuffer())
					.then( array_buffer => {
						this.audio_context.decodeAudioData( array_buffer, audio_buffer => {
							this.sounds[ name] = { audio_buffer, options };
						});
						return 'success'
					})
				)
			)
		else
			return Promise.all(
				sounds_data.map( ([name, file, options={}]) => fetch( getFilePath(file))
					.then( response => response.arrayBuffer())
					.then( array_buffer => this.audio_context.decodeAudioData( array_buffer))
					.then( audio_buffer => this.sounds[ name] = { audio_buffer, options })
					.catch( err => log('err',err))
				)
			)
	}
	playSound (name){
		if( !this.sounds[ name]){
			log('err', 'no sound with name:', name, 'check if sounds are set up');
			return
		}
		const { audio_buffer, options } = this.sounds[ name];
		//log('info', 'playSound:', name, options.volume)
		const source = this.audio_context.createBufferSource();
		source.buffer = audio_buffer;
		this.gain_node.gain.value = this.global_volume * (options.volume || 1);
		source.connect( this.gain_node).connect( this.audio_context.destination);
		this.playing_source = source;

		if( options.delay)
			setTimeout( e => {
				source.start();
			}, options.delay);
		else
			source.start();
	}
	stopSound (){
		//log('err', 'stop:', this.playing_source)
		if( this.playing_source){
			this.playing_source.stop();
			this.playing_source = null;
		}
	}

	/** Get or Set; @param path string of nested prop with dot notation */
	prop (path, value){ // 'this.prop.sub-prop'

		let target = this;
		let keys = path.split('.');
		let last_key = keys.pop();

		for (let k of keys)
			target = target[ k];

		if (!target){
			log('err', 'cannot get prop', path);
			return
		}
		// GET
		if (value === undefined){
			P.init( this, target, last_key, keys[0]||last_key);
			return P
		}
		// SET
		else {
			try {
				target[last_key] = value;
			}
			catch (err){
				log('err', 'err:', err);
			}
			this[keys[0]] = this[keys[0]]; // trigger top-level prop
			return this
		}
	}

	/**
	 * Utility to get a value / validate it and compute a new value from it to return
	 * Will render right after returning;
	 * @return the result of computer if validator returns true, otherwise returns null
	 */
	validateAndCompute (value, validator, computer){
		setTimeout( t => this.render());
		return validator(value) ? computer(value) : null
	}

	registerSW(){
		//log('info', 'registerSW()', config.sw)
		if ('serviceWorker' in navigator)
		navigator.serviceWorker.register(config.sw)
			.then( reg => {
				log('info',"Service Worker Registered");
				reg.onupdatefound = () => {
					log('ok', 'SW update found');
					let installing_worker = reg.installing;
					installing_worker.onstatechange = async () => {
						log('ok', 'SW State: ', installing_worker.state);
						switch( installing_worker.state){
							case 'installed':
								// WAIT FOR A POSSIBLE "REDUNDANT" STATE
								// CHROME MOBILE MAY BYPASS CACHE REFRESH ?
								setTimeout( () => {
									// navigator.serviceWorker.controller is unreliable when calling update manually
									if( !active_sw && !redundant){
										// log('info', 'App is now available offline')
										this.classList.add('cached');
										// this.toast.setMessage( this.$cached, ['OK', this.$install_standalone])
										// 	.then( answer => {
										// 		this.toast.show = false
										// 		if( answer === 1 && this.deferredPrompt)
										// 			this.install()
										// 	})
									}
									else {
										// LONG RUNNING NETWORK CONNECTION (LIKE FIREBASE FIRESTORE)
										// MAY PREVENT ACTIVATION FOR A WHILE; LOG TO KNOW
										log('info', 'SW Update is available, waiting for activation…');
									}
								}, 200);
								break

							case 'activated':
								/// IF NOT FIRST INSTALL, SHOW UPDATE READY: PLEASE REFRESH | LATER
								if( active_sw || redundant)
									this.onCacheUpdated && this.onCacheUpdated();
									// this.toast.setMessage( this.$update_ready, [this.$later, this.$refresh])
									// 	.then( answer => {
									// 		if( answer === 0)
									// 			this.toast.show = false
									// 		else
									// 			location.reload()
									// 	})
								break

							case 'redundant':
								redundant = true;
								break
						}
					};
				};

				setTimeout( e => {
					let btn = q('#test-update-btn');
					if (btn)
					btn.onclick = () => {
						reg.update();
					};
				}, 100);

				// check for sw.js update once in a while to notify a user using the app for a long time
				// We can just change the const VERSION in sw.js and user will be notified of a new update available when cache has been updated
				setInterval( () => {
					log('ok', 'checking for service worker update...');
					reg.update();
				}, 1000 * 60 * config.update_check_min);
			});
	}

	/**
		* Custom config; all props are optional, use default values
		* @param {object} user_config
		* @param {string} [user_config.sw=null] Path of service worker
		* @param {object} [user_config.paths]
		* @param {string} [user_config.paths.components] - Path of the components directory
		* @param {string} [user_config.paths.icons] - Path to the icons file
		* @param {number} [user_config.update_check_min]  - Number of minutes for checking sw.js update
		* @param {number} [user_config.font_size_decimals] - Integer. How many decimal places to use when setting html font-size.
		* @param {object} [user_config.icons_mappings]
		* 	maps alternative (reprensentative rather than descriptive)
		* 	icon names to the real svg ids
		* @param {object} [user_config.icons_viewbox]
		* @param {string[]} [user_config.night_modes]
	*/
	static set config (user_config) {
		config = mergeDeep(config, user_config);
		log('check', 'user config:', config);
	}

	static get config(){
		return config
	}

	/**
	 * Array of languages (lang codes) we want to use for strings, pages and others (like options.labels for vs-selector), e.g. 'en', 'fr' etc.
	 * @type {string[]}
	 */
	static languages;

	/**
	 * @typedef {object} pages
	 * @type {Object.<string, string[]>}
	 * @memberof VisionStage
	 */
	/**
	 * Defines virtual pages (#) and links;
	 * - Key format:
	 * 	- bare name for a virual page; use the name to define a method for its template (if using the default code for multi-templates)
	 * 	- '/name' or './name for abs or rel links
	 * 	- 'http...' for ext links //! todo
	 * - Value format: an array with at least one title, following the `VisionStage.languages` order;
	 * 	The title is used for links (`getPageLink(page)`) and in the case of virtual pages, for the url hash and `document.title`.
	 * @type {pages}
	 */
	static pages;

	/**
  	 * @typedef aspects
 	 * @type {Object}
	 * @prop {number} [portrait_min]	- Max vertical space in portrait.
	 * - Narrower than this will create empty space above and below the stage - normally we don't want that…
	 * @prop {number} [portrait_alt]	- Alternative min horizontal space in portrait
	 * - Use a lower ratio than portrait.
	 * - This apply to elem.alt-scaling and children using em based sizing. We can exclude elements that we want to scale like content simply by using rem based sizing instead.
	 * - Allows offsetting the scaling down for content which can remain bigger (have enought space) on narrower screens.
	 * - Demos use this for #app-header and #app-footer so buttons and links remain bigger relative to content, since there's enough room; the ratio where it's getting too narrow is the value we should use here.
	 * @prop {number} [portrait]		- Min horizontal space in portrait
	 * @prop {number} [portrait_max]	- Max horizontal space in portrait
	 * @prop {number} [threshold=1]	- Ratio where the shift between landscape & portrait happens.
	 * - We could set this to > 1 to switch to portrait before having huge empty space top/bottom - we're better with full height / larger scale when we have a portrait layout anyway.
	 * @prop {number} [landscape]		- Min horizontal space in landscape
	 * @prop {number} [landscape_max] - Max horizontal space in landscape
	 * @prop {string} [cross_margin='0'] - Percentage of margin to add on opposite side of "black bars"
	 * - This is to counter the letterbox effect, which happens in landscape when the window's AR is > than landscape_max or < than landscape
	 * @prop {number} [height=40] 	- Vertical space in rem
	 * @prop {number} [portrait_height=40] - Vertical space in rem for portrait mode
	*/
	/**
	 * Aspect-ratios constraints for the stage. All properties are optional.
	 * @prop {number} [portrait_min]
	 * @prop {number} [portrait_alt]
	 * @prop {number} [portrait]
	 * @prop {number} [portrait_max]
	 * @prop {number} [landscape]
	 * @prop {number} [landscape_max]
	 * @prop {number} [threshold=1]
	 * @prop {number} [height=40]
	 * @prop {number} [portrait_height=40]
	 * @prop {string} [cross_margin='0']
	 *
	 * @type {aspects}
	 */
	static aspects;

	/**
	 * Sounds to use
	 * @type {Object.<string, (string|object)>}
	 * @usage
	 * - `VisionStage.sounds = { name: 'file' | ['file', { volume: 1 }]};`
	 * - App -> `this.playSound( name); this.stopSound()`
	 *
	 * Note: volume will jump if multiple sounds with different volumes are overlapping…
	 */
	static sounds;

	/**
	 * @typedef {object} strings
	 * @type {Object.<string, string[]>}
	 * @memberof VisionStage
	 */
	/**
	 * Localized strings; follow the `VisionStage.languages` order.
	 *
	 * @type {strings}
	 * @usage
	 * - `VisionStage.strings = { name: [ strEN, strFR, … ], … }`
	 */
	static strings;


	/**
	 * Prop Object
	 * @typedef propObject
	 * @type {Object}
	 * @prop {any} value - Initial value
	 * @prop {Boolean} [storable] - Is storable
	 * @prop {Function} [watcher] (value, prev) - Function to call when prop changes
	 * @prop {Function} [transformer] (value, prev) => new_val - Function to validate value before setting it.
	 * @prop {bool} [init_watcher] Trigger the watcher once when app starts
	 * @prop {string} [class] Name of CSS class to toggle following the truthiness of value
	 * @prop {(string|[])} [attribute] Name for an attribute to set the value on | [name,'bool'|'auto']
	 * @prop {bool} [sync_to_url_param=false] Two way binding to URL param (`myapp/#pageA/night_mode=true`)
	 * @prop {bool} [reactive=true] Set to false to disable auto-render on change [@todo: rename that!]
	 * @prop {bool} [force_render=false] Do render even if value is the same
	 * @prop {function} [getter] To (re)compute a value each time we `get` this prop
	 * - 'bool': to use with bool value type to add or remove valueless attribute accordingly.
	 * - 'auto': to add attribute and set the value if truthy, or remove it if falsy.
	 * @memberof VisionStage
	 */
	/**
	 * @typedef {object} properties
	 * @type {Object.<string, propObject>}
	 * @memberof VisionStage
	 */
	/**
	 * @type {properties} Reactive properties.
	 *
	 * A property will at least trigger this.render(),
	 * and may have many options:
	 * @prop {any} value - Initial value
	 * @prop {Boolean} [storable] - Is storable
	 * @prop {Function} [watcher] (value, prev) - Function to call when prop changes
	 * @prop {Function} [transformer] (value, prev) => new_val - Function to validate value before setting it.
	 * @prop {bool} [init_watcher] Trigger the watcher once when app starts
	 * @prop {string} [class] Name of CSS class to toggle following the truthiness of value
	 * @prop {(string|[])} [attribute] Name for an attribute to set the value on | [name,'bool'|'auto']
	 * @prop {bool} [sync_to_url_param=false] Two way binding to URL param (`myapp/#pageA/night_mode=true`)
	 * @prop {bool} [reactive=true] Set to false to disable auto-render on change [@todo: rename that!]
	 * @prop {bool} [force_render=false] Do render even if value is the same
	 * @prop {function} [getter] To (re)compute a value each time we `get` this prop
	 */
	static properties;
}

// these next static properties are underscore prefixed
// so they are merged instead of overriden next by > MyApp.properties
/**
 * @type {properties}
 */
VisionStage._properties = {
	is_portrait: null,
	title: '',
	resizing: {
		value: false,
		class: 'resizing',
		reactive: false
	},
	global_volume: {
		value: .6,
		storable: '/', // shared accross all apps
		reactive: false
	},
	lang: {
		value: navigator.language.slice(0,2),
		storable: '/', // shared accross all apps
		force_render: true,
		watcher( val, prev){
			//log('pink', 'lang:', val)
			// set complete lang code on <html> for speak function
			let [lang, country] = navigator.language.split('-');
			document.documentElement.setAttribute('lang', val);// + '-' + country)
			this.country = country;
			// set val (2 letter) on this element for CSS auto hide of els w/ [lang] not matching
			this.setAttribute('lang', val);
			this.lang_index = this.languages.indexOf( val);
			this.onLanguageChanged?.(val, prev);
			// log('err', 'this.lang_index:', this.lang_index)
			// update hash and doc title

			if( this.pages && this.page){
				// update hash / page title for current lang
				let {path} = this.getPage();
				let new_page = path.split('/')[0];
				let h = decodeURI( location.hash.slice(1));
				let [old_page, ...params] = h.split('/');
				location.hash = new_page + '/' + params.join('/');
				this.updateDocTitle();
			}
			// log('info', 'lang, country:', lang, country)
		},
		//init_watcher: true // causes render (SET lang), maybe too soon, keep manual
		// -> instead just re-trigger after this is rendered (this.lang = this.lang)
	},
	night_mode: {
		value: 0,
		sync_to_url_param: true, // if url param is passed, will override stored value
		storable: '/', // shared accross all apps
		//attribute: ['night-mode', 'auto'], // auto -> remove if falsy, otherwise use value
		init_watcher: true,
		watcher( val){
			if (val)
				document.body.setAttribute('night-mode', val);
			else
				document.body.removeAttribute('night-mode');
			document.body.style.setProperty('color-scheme', val ? 'dark' : 'light');
		}
	},
	show_menu: {
		value: false,
		class: 'show-menu',
		async watcher(show){
			if (!show){
				this.setAttribute('hidding', 'menu');
				this.q('nav.v-menu')?.style.removeProperty('pointer-events');
			}
			await sleep(333);

			if (show)
				this.q('nav.v-menu')?.style.setProperty('pointer-events', 'auto');
			else
				this.removeAttribute('hidding');
		}
	},
	page: {
		value: null,
		attribute: 'page',
		watcher( val, prev){

			// remove trailing #
			if( !val && location.href.endsWith('#') && window.self === window.top)
				history.replaceState( null, '', location.pathname);

			if (this.params && this.sync_props_to_params){ // skip if no props are syncable
				for (let [p,val] of this.params){
					if (p in this){
						this[p] = val;
					}
				}
			}

			this.onPageChanged && this.onPageChanged( val, prev);
		}
	},
};

/**
 * @type {strings}
 */
VisionStage._strings = {
	fullscreen: ["Fullscreen", "Plein écran"],
	night_mode: ["Night Mode", "Mode nuit"],
};


/**
 * Helper object which is setup and returned by this.prop()
 * Gives methods to operate on array and object props and render the target.
 */
const P = {

	init (target, prop_object, prop_name, parent_prop_name){
		//log('ok', 'init prop:', this.parent_prop_name)
		this.target = target;
		this.prop_object = prop_object;
		this.prop_name = prop_name;
		this.parent_prop_name = parent_prop_name;
		this.prop = this.prop_object[ this.prop_name];
		//log('err', 'prop obj:', this.prop_object, prop_name)
		//debugger
	},
	/** triggers transformer/watcher/render by re-setting the top prop */
	resetTarget(){
		// log('check', 'reset target:', this.parent_prop_name, this.prop_name)
		this.target[ this.parent_prop_name] = this.target[ this.parent_prop_name];
		return this
	},

	// -> this.prop('todo', this.prop('todos').push( this.newTodo( val)))

	/** @return the new value */
	push (value){
		this.prop.push( value);
		this.resetTarget();
		return value
	},
	/** @return the new value */
	pushStart (value){
		this.prop.unshift( value);
		this.resetTarget();
		return value
	},
	pop(){
		setTimeout( t => this.resetTarget());
		return this.prop.pop()
	},
	popStart(){
		setTimeout( t => this.resetTarget());
		return this.prop.shift()
	},
	splice (index, delete_count=1, ...inserts){
		this.prop.splice( index, delete_count, ...inserts);
		this.resetTarget();
	},
	remove (index){ this.splice( index); },
	insert (index, ...values){ this.splice( index, 0, ...values); },

	/** flips a nested prop value and re-set: this.prop('options.xmode').flip() */
	flip(){
		this.prop_object[ this.prop_name] = !this.prop_object[ this.prop_name];
		this.resetTarget();
	},

	/** select an item or unselect it if already set, as the value for a prop */
	toggleSelect (item){
		//! what if nested prop?
		// this.prop = this.prop===item ? null : item
		this.prop_object[ this.prop_name] = this.prop===item ? null : item;
		this.resetTarget();
	},
	// -> this.prop('todo').toggleSelect( todo) // instead of
	// 	this.todo = this.todo===todo ? null : todo ; this.render()

	/** find a [name,value] pair by name for the selected prop
     * and return the value only, unless we want the whole pair */
	get (name, return_value_only=true){
		log('check', 'get:', name, 'this.prop:', this.prop);
		let found = this.prop.find( ([n,v]) => n===name);
		return return_value_only ? (found||[])[1] : found
	},
	set (name, value){ // pair is created if not found
		let pair = this.get( name, false);
		if( pair)
			pair[1] = value;
		else
			this.prop.push( [name, value]);
		this.resetTarget();
	},

	// cycle
	nextIn (values, steps=1, wrap=true){
		let start = values.indexOf( this.prop);
		let next = (values.length + start + steps);
		if( wrap) next = next % values.length;
		else next = clamp( next, 0, values.length-1);
		return this.prop_object[ this.prop_name] = values[ next]
	},
};

/**
 * Defines a custom element (window.customElements.define) and return whenDefined promise
 * @param {string[]} components wait and load required components before define
 * @return whenDefined's promise
 * @usage `define('my-comp', MyCompClass, [])`
 */
async function define( tag_name, clss, components=null, extends_elem=null){

	// import comps (js & css) dependencies (when required right from the start)
	if (components && components.length){ // app is not defined yet
		components = components.map(c => Component.load( c));
		await Promise.all(components);
	}

	const opts = extends_elem ? { extends: extends_elem } : null;
	window.customElements.define(tag_name, clss, opts);

	return window.customElements.whenDefined(tag_name).then( () => {
		//log('check', 'when defined:', tag_name)
		if (tag_name === 'vision-stage'){

			app.resize();
			app.classList.add('resized');

			setTimeout( e => {
				window.addEventListener('resize', debounce( app.resize.bind( app), 300, 300));
			});
			// ->  Arg 1: debounce dly (wont callback until you stop calling and after a delay),
			// ->  Arg 2: throttle dly (wont callback more often than at this frequency)
		}
	})
}

/**	=> html`<svg><use src='#'>...</svg>` */
function useSVG( id, clss, ar){
	let src = config.paths.icons;
	// proxy names
	if( config.icons_mappings[id])
		id = config.icons_mappings[id];
	let vb = config.icons_viewbox[id] || '0 0 32 32';

	return html`<svg class=${clss ? 'icon '+clss : 'icon'} viewBox=${vb} preserveAspectRatio=${ ifDefined( ar) }>
		<use href='${src}#${id}'/>
	</svg>`
}
/** wraps useSVG symbol inside a `span.vs-icon` */
const icon = (svg_id, clss='', opts={}) =>
	html`<span class='vs-icon ${clss}'>${ useSVG( svg_id, opts.svg_class||'', opts.ar) }</span>`;
const maybe = thing => thing || {};
const classes = (...classes) => classes.filter( c => c).join(' ');


///  STORE  ///

/**
 * Global localStorage key is the path for the app (/ => -)
 * Other components must have an id as sub-key to use storable on a property.
 */

/** Parse store from localStorge or init a new one */
function initStore(ns){
	//log('purple', 'init store:', ns)
	// debugger
	//store_namespace = ns
	if (!ns){
		log('err', 'no store namespace');
		return
	}

	const stored_data = localStorage.getItem(ns);

	if (stored_data){ // set stored_data in stores[ns]
		log('purple','initStore(); ns, stored_data:', ns);
		log(stored_data);
		try { stores[ns] = JSON.parse(stored_data); }
		catch (err) {
			log('err','JSON parse error');
			log('warn', 'stored_data:', stored_data);
		}
	}
	// no stored_data or failed to parse
	if (! stores[ns] || ! isObject(stores[ns])){
		//if (debug.store) log('notok', 'no stored_data or failed to parse, set a new one empty')
		log('purple', 'initStore(); no stored data; set new empty store', ns);
		stores[ns] = {};
	}
	else if (debug.store) {
		log('ok', 'GOT store:');
		log( stores[ns]);
		//log(JSON.stringify(store,null,2))
	}
}
/** Get a possibly stored value || undefined */
function storedValue(ns, elem_id, prop){
	if (!ns) return undefined
	let s = stores[ns]?.[elem_id];
	if( !stores[ns]){
		// store not initialized
		initStore(ns);
		s = stores[ns]?.[elem_id];
	}
	s?.[prop]!==undefined && log('purple', 'Got storedValue:', prop, s[prop]);
	return s ? s[prop] : undefined
}
/** either save to localStorage after setting a prop on elem, or just save */
function saveStore(ns, elem_id, prop, val, remove=false){
	// log('check', 'saveStore(ns, elem_id, prop, val):', {ns, elem_id, prop, val})
	if (window.do_not_store){
		return
	}
	//! was async: problem if used on unload event... cannot block
	//!  => should make async + another sync version for unload

	const store = stores[ns];

	if (!store) return null

	//log('err', '--save to store, elem id:', elem_id)

	if (elem_id){ /// WE WANT TO SET A STORE VALUE BEFORE SAVING

		if (remove){
			log('err', 'DELETE:', elem_id, prop);
			if( store[elem_id]){
				delete store[elem_id][ prop];
				/// if this elem has no more stored props, delete its store
				if( ! Object.keys(store[elem_id]).length)
					delete store[elem_id];
			}
		}
		else {
			//if( debug.store)
			log('check', 'STORING:', ns, elem_id, prop, val);
			if( store[elem_id] === undefined)
				store[elem_id] = {};
			store[elem_id][prop] = val;
		}
	}

	const str = JSON.stringify(store);
	if (debug.store)
		log('pink', '--will store string:', str);

	// log('purple', 'set localstorage:', ns, str)
	localStorage.setItem(ns, str);
}

function saveStores(){
	// log('purple', 'saveStores()', )
	for (let ns in stores)
		saveStore(ns);
}

function clearStore(ns){

	if(!ns){ // recreate this.ns
		const path = decodeURI(location.pathname);
		ns = path.slice(1,-1).replace(/\//g, '-') || 'home';
	}

	if (localStorage.getItem('store_cleared') === 'true'){
		// log('warn', 'store_cleared value', localStorage.getItem('store_cleared'))
		localStorage.removeItem('store_cleared');
		//log('warn', 'store_cleared value', localStorage.getItem('store_cleared'))
		return
	}

	log('err', 'clear store:', ns);
	localStorage.removeItem(ns);
	log('err', 'Store cleared');
	localStorage.setItem('store_cleared', 'true');
	window.do_not_store = true; // prevent storing on before reload
	location.reload();
}
/** clear all stores for current app */
function clearStores(){
	if (localStorage.getItem('store_cleared') === 'true'){
		log('err', 'stores all cleared; return:', );
		localStorage.removeItem('store_cleared');
		return
	}
	log('err', 'clearStores()', JSON.stringify(stores));
	for (let ns in stores){
		log('err', 'clear store:', ns);
		localStorage.removeItem(ns);
		log('err', 'Store cleared');
	}
	localStorage.setItem('store_cleared', 'true');
	window.do_not_store = true; // prevent storing on before reload
	location.reload();
}

const throttled_saveStores = debounce( saveStores, 200);

// screenfull.min.js
!function(){var e=window.document,n=function(){for(var n,r=[["requestFullscreen","exitFullscreen","fullscreenElement","fullscreenEnabled","fullscreenchange","fullscreenerror"],["webkitRequestFullscreen","webkitExitFullscreen","webkitFullscreenElement","webkitFullscreenEnabled","webkitfullscreenchange","webkitfullscreenerror"],["webkitRequestFullScreen","webkitCancelFullScreen","webkitCurrentFullScreenElement","webkitCancelFullScreen","webkitfullscreenchange","webkitfullscreenerror"],["mozRequestFullScreen","mozCancelFullScreen","mozFullScreenElement","mozFullScreenEnabled","mozfullscreenchange","mozfullscreenerror"],["msRequestFullscreen","msExitFullscreen","msFullscreenElement","msFullscreenEnabled","MSFullscreenChange","MSFullscreenError"]],l=0,t=r.length,c={};l<t;l++)if((n=r[l])&&n[1]in e){for(l=0;l<n.length;l++)c[r[0][l]]=n[l];return c}return !1}(),r={change:n.fullscreenchange,error:n.fullscreenerror},l={request:function(r,l){return new Promise(function(t,c){var u=function(){this.off("change",u),t();}.bind(this);this.on("change",u);var s=(r=r||e.documentElement)[n.requestFullscreen](l);s instanceof Promise&&s.then(u).catch(c);}.bind(this))},exit:function(){return new Promise(function(r,l){if(this.isFullscreen){var t=function(){this.off("change",t),r();}.bind(this);this.on("change",t);var c=e[n.exitFullscreen]();c instanceof Promise&&c.then(t).catch(l);}else r();}.bind(this))},toggle:function(e,n){return this.isFullscreen?this.exit():this.request(e,n)},onchange:function(e){this.on("change",e);},onerror:function(e){this.on("error",e);},on:function(n,l){var t=r[n];t&&e.addEventListener(t,l,!1);},off:function(n,l){var t=r[n];t&&e.removeEventListener(t,l,!1);},raw:n};n?(Object.defineProperties(l,{isFullscreen:{get:function(){return Boolean(e[n.fullscreenElement])}},element:{enumerable:!0,get:function(){return e[n.fullscreenElement]}},isEnabled:{enumerable:!0,get:function(){return Boolean(e[n.fullscreenEnabled])}}}),window.screenfull=l):window.screenfull={isEnabled:!1};}();

// if needed, should be a member of app
// export const px2rem = (px, decimals=FONT_SIZE_DECIMALS) => {
// 	return app && px/app.REM || 0 // ex: px=100, app.REM=16 = 100/16 = 6.25rem
// }

/**
 Font size decimals:
 Decimals allow for more precise scaling of content compare to stage:
 - 0 or 1 means that when resizing the window, content may not be sized or positioned exactly the same in relation to stage (which doesn't rounds its dimensions)
 - But fractional font-size may sometimes results in artifacts in rendering, like uneven, blurry lines.
 */

export { Component, P, VisionStage, cache, classes, clearStore, clearStores, define, guard, html, icon, ifDefined, render as litRender, live, maybe, repeat, saveStore, svg, unsafeHTML, useSVG };

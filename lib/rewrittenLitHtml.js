// Here I will attempt to learn lit-html by rewriting the whole library
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /** HERE
     * The first argument to JS template tags retains identity across multiple calls
     * to a tag for the same literal, so we can cache work done per literal in a Map.
     */
    var templates = new Map();
    /**
     * Interprets a template literal as an HTML template that can efficiently
     * render to and update a container.
     * Strings is is an array of template strings, and values can be anything
     * Results in `TemplateResult`
     */
    function html(strings) {
        var values = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            values[_i - 1] = arguments[_i];
        }
        var template = templates.get(strings); // see if it's cached
        if (template === undefined) {
            template = new Template(strings);
            templates.set(strings, template);
        }
        return new TemplateResult(template, values);
    }
    /**
     *
     * The return type of `html`, which holds a Template and >the values from
     * interpolated expressions.
     *
     * TemplateResult is a class that holds a Template object parsed from a
     * template literal and the values from its expressions.
     */
    var exprMarker = '{{}}';
    var TemplateResult = /** @class */ (function () {
        function TemplateResult(template, values) {
            this.template = template;
            this.values = values;
        }
        return TemplateResult;
    }());
    /**
     * Property element: HTMLTemplateElement
     * Property parts: Part[]
     */
    var Template = /** @class */ (function () {
        function Template(strings) {
            this.parts = [];
            this.element = document.createElement('template');
            this.element.innerHTML = strings.join(exprMarker);
            var walker = document.createTreeWalker(this.element.content, 5 /* elements & text */);
            var index = -1;
            var partIndex = 0;
            var nodesToRemove = [];
            while (walker.nextNode()) {
                index++;
                var node = walker.currentNode;
                if (node.nodeType === 1 /* ELEMENT_NODE */) {
                    console.log('tree node type is element');
                    if (!node.hasAttributes())
                        continue;
                    var attributes = node.attributes;
                    for (var i = 0; i < attributes.length; i++) {
                        var attribute = attributes.item(i);
                        var attributeStrings = attribute.value.split(exprMarker);
                        if (attributeStrings.length > 1) {
                            // Get the template literal section leading up to the first expression
                            // in this attribute attribute
                            var attributeString = strings[partIndex];
                            // Trim the trailing literal value if this is an interpolation
                            var rawNameString = attributeString.substring(0, attributeString.length - attributeStrings[0].length);
                            // HERE: Find out why this is null, when it should never be
                            var rawNameMatch = rawNameString.match(/((?:\w|[.\-_$])+)=['']?$/);
                            var rawName = rawNameString.match(/((?:\w|[.\-_$])+)=['']?$/)[1];
                            this.parts.push(new TemplatePart('attribute', index, attribute.name, rawName, attributeStrings));
                            node.removeAttribute(attribute.name);
                            partIndex += attributeStrings.length - 1;
                            i--;
                        }
                    }
                }
                else if (node.nodeType === 3 /* TEXT_NODE */) {
                    var strings_1 = node.nodeValue.split(exprMarker);
                    if (strings_1.length > 1) {
                        var parent = node.parentNode; // non-null assertion operator
                        var lastIndex = strings_1.length - 1;
                        // We have a part for each match found
                        partIndex += lastIndex;
                        // We keep this current node, but reset its content to the last
                        // literal part. We insert new literal nodes before this so that the
                        // tree walker keeps its position correctly.
                        node.textContent = strings_1[lastIndex];
                        // Generate a new text node for each literal section
                        // These nodes are also used as the markers for node parts
                        for (var i = 0; i < lastIndex; i++) {
                            parent.insertBefore(new Text(strings_1[i]), node);
                            this.parts.push(new TemplatePart('node', index++));
                        }
                    }
                    else if (!node.nodeValue.trim()) {
                        nodesToRemove.push(node);
                        index--;
                    }
                }
            }
            // Remove text binding nodes after the walk to not disturb the TreeWalker
            for (var _i = 0, nodesToRemove_1 = nodesToRemove; _i < nodesToRemove_1.length; _i++) {
                var n = nodesToRemove_1[_i];
                n.parentNode.removeChild(n);
            }
        }
        return Template;
    }());
    var TemplatePart = /** @class */ (function () {
        function TemplatePart(type, index, name, rawName, strings) {
            this.type = type;
            this.index = index;
            this.name = name;
            this.rawName = rawName;
            this.strings = strings;
        }
        return TemplatePart;
    }());
    /**
     * Renders a template to a container.
     *
     * To update a container with new values, reevaluate the template literal and
     * call `render` with the new result.
     */
    function render(result, container, partCallback) {
        var instance = container.__templateInstance;
        // Repeat render, just call update()
        if (instance !== undefined &&
            instance.template === result.template &&
            instance._partCallback === partCallback) {
            instance.update(result.values);
            return;
        }
        // First render, create a new TemplateInstance and append it
        instance = new TemplateInstance(result.template, partCallback);
        container.__templateInstance = instance;
        var fragment = instance._clone();
        instance.update(result.values);
        // removing children and adding parts instead
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        container.appendChild(fragment);
    }
    exports.render = render;
    var TemplateInstance = /** @class */ (function () {
        function TemplateInstance(template, partCallback) {
            if (partCallback === void 0) { partCallback = exports.defaultPartCallback; }
            this._parts = [];
            this.template = template;
            this._partCallback = partCallback;
        }
        return TemplateInstance;
    }());
    exports.TemplateInstance = TemplateInstance;
    exports.defaultPartCallback = function (instance, templatePart, node) {
        if (templatePart.type === 'attribute') {
            return new AttributePart(instance, node, templatePart.name, templatePart.strings);
        }
    };
    var AttributePart = /** @class */ (function () {
        function AttributePart(instance, element, name, strings) {
            this.instance = instance;
            this.element = element;
            this.name = name;
            this.strings = strings;
            this.size = strings.length - 1;
        }
        AttributePart.prototype.setValue = function (values, startIndex) {
            var strings = this.strings;
            var text = "";
            for (var i = 0; i < strings.length; i++) {
                text += strings[i];
                if (i < strings.length - 1) {
                    var v = exports.getValue(this, values[startIndex + i]);
                    if (v &&
                        (Array.isArray(v) || (typeof v !== "string" && v[Symbol.iterator]))) {
                        for (var _i = 0, v_1 = v; _i < v_1.length; _i++) {
                            var t = v_1[_i];
                            // TODO: we need to recursively call getValue into iterables...
                            text += t;
                        }
                    }
                    else {
                        text += v;
                    }
                }
            }
            this.element.setAttribute(this.name, text);
        };
        return AttributePart;
    }());
    exports.AttributePart = AttributePart;
    exports.getValue = function (part, value) {
        // `null` as the value of a Text node will render the string 'null'
        // so we convert it to undefined
        if (value != null && value.__litDirective === true) {
            value = value(part);
        }
        return value === null ? undefined : value;
    };
});

// Here I will attempt to learn lit-html by rewriting the whole library
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
var TemplateResult = (function () {
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
var Template = (function () {
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
                        // HERE: getting some null error
                        var rawNameMatch = rawNameString.match(/((?:\w|[.\-_$])+)=['']?$/);
                        if (rawNameMatch) {
                            var rawName = rawNameMatch[1];
                            this.parts.push(new TemplatePart('attribute', index, attribute.name, rawName, attributeStrings));
                        }
                        node.removeAttribute(attribute.name);
                        partIndex += attributeStrings.length - 1;
                        i--;
                    }
                }
            }
            else if (node.nodeType === 3 /* TEXT_NODE */) {
                console.log('tree node type is text');
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
var TemplatePart = (function () {
    function TemplatePart(type, index, name, rawName, strings) {
        this.type = type;
        this.index = index;
        this.name = name;
        this.rawName = rawName;
        this.strings = strings;
    }
    return TemplatePart;
}());

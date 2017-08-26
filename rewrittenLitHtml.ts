// Here I will attempt to learn lit-html by rewriting the whole library

/** HERE
 * The first argument to JS template tags retains identity across multiple calls 
 * to a tag for the same literal, so we can cache work done per literal in a Map.
 */
const templates = new Map<TemplateStringsArray, Template>();

/**
 * Interprets a template literal as an HTML template that can efficiently
 * render to and update a container.
 * Strings is is an array of template strings, and values can be anything
 * Results in `TemplateResult`
 */
function html(strings: TemplateStringsArray, ...values: any[]): TemplateResult {
  let template = templates.get(strings); // see if it's cached
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

const exprMarker = '{{}}';

class TemplateResult {
  template: Template;
  values: any[];

  constructor(template: Template, values: any[]) {
    this.template = template;
    this.values = values;
  }
}

/** 
 * Property element: HTMLTemplateElement
 * Property parts: Part[]
 */

class Template {
  parts: TemplatePart[] = [];
  element: HTMLTemplateElement;

  constructor(strings: TemplateStringsArray) {
    this.element = document.createElement('template');
    this.element.innerHTML = strings.join(exprMarker);
    const walker = document.createTreeWalker(
      this.element.content,
      5 /* elements & text */
    );
    let index = -1;
    let partIndex = 0;
    const nodesToRemove = [];

    while (walker.nextNode()) {
      index++;
      const node = walker.currentNode as Element;
      if (node.nodeType === 1 /* ELEMENT_NODE */) {
        console.log('tree node type is element');
        if (!node.hasAttributes()) continue;
        const attributes = node.attributes;
        for (let i = 0; i < attributes.length; i++) {
          const attribute = attributes.item(i);
          const attributeStrings = attribute.value.split(exprMarker);
          if (attributeStrings.length > 1) {
            // Get the template literal section leading up to the first expression
            // in this attribute attribute
            const attributeString = strings[partIndex];
            // Trim the trailing literal value if this is an interpolation
            const rawNameString = attributeString.substring(0, attributeString.length - attributeStrings[0].length);
            // HERE: Find out why this is null, when it should never be
            const rawNameMatch = rawNameString.match(/((?:\w|[.\-_$])+)=['']?$/)!;
            const rawName = rawNameString.match(/((?:\w|[.\-_$])+)=['']?$/)![1];
            this.parts.push(
                new TemplatePart(
                  'attribute',
                  index,
                  attribute.name,
                  rawName,
                  attributeStrings
                )
              );
              node.removeAttribute(attribute.name);
              partIndex += attributeStrings.length - 1;
              i--;
          }
        }
      } else if (node.nodeType === 3 /* TEXT_NODE */) {
        const strings = node.nodeValue!.split(exprMarker);
        if (strings.length > 1) {
            const parent = node.parentNode!; // non-null assertion operator
            const lastIndex = strings.length - 1;

            // We have a part for each match found
            partIndex += lastIndex;

            // We keep this current node, but reset its content to the last
            // literal part. We insert new literal nodes before this so that the
            // tree walker keeps its position correctly.
            node.textContent = strings[lastIndex];

            // Generate a new text node for each literal section
            // These nodes are also used as the markers for node parts
            for (let i = 0; i < lastIndex; i++) {
                parent.insertBefore(new Text(strings[i]), node);
                this.parts.push(new TemplatePart('node', index++));
            }
        } else if (!node.nodeValue!.trim()) {
            nodesToRemove.push(node);
            index--;
        }
      }
    }

    // Remove text binding nodes after the walk to not disturb the TreeWalker
    for (const n of nodesToRemove) {
      n.parentNode!.removeChild(n);
    }
  }
}

class TemplatePart {
  constructor(
    public type: string,
    public index: number,
    public name?: string,
    public rawName?: string,
    public strings?: string[]
  ) {}
}

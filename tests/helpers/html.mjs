// Attribute-level checks should survive indentation and attribute reordering.
export function attributes(tag) {
  return Object.fromEntries(
    [...tag.matchAll(/\s([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map(
      ([, name, double, single]) => [name.toLowerCase(), double ?? single],
    ),
  );
}

export function markup(source) {
  return source
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, (tag, name) =>
      tag.slice(0, tag.indexOf('>') + 1) + '</' + name + '>',
    );
}

export function elements(source, name) {
  return [...markup(source).matchAll(new RegExp('<' + name + '\\b[^>]*>', 'gi'))].map(
    ([tag]) => attributes(tag),
  );
}

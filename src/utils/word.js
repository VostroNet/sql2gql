export function capitalize(word = "") {
  if (word === "") {
    return "";
  }
  return `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`;
}

export function lowecase(word = "") {
  if (word === "") {
    return "";
  }
  return `${word.charAt(0).toLowerCase()}${word.slice(1)}`;
}

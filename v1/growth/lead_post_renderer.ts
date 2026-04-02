export function renderLeadPost(post) {
  return [
    post.hook,
    "",
    ...post.body,
    "",
    post.offer,
    post.proof,
    "",
    post.cta
  ].join("\n");
}

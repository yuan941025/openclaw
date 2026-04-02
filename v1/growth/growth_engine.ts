import { buildLeadPost } from "./lead_post_builder.ts";
import { renderLeadPost } from "./lead_post_renderer.ts";

export function generateLeadContent() {
  const post = buildLeadPost();
  const full_text = renderLeadPost(post);

  return {
    post,
    full_text
  };
}

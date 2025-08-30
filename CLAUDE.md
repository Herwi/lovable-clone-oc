## Project Goals
- This is a lovable clone, with claude-code sdk used. I'd like to modify it to be creating and publishing opencomponents to open components registry.
- Daytona should be used as a self hosted version for privacy.

## Progress so far
- We have a website that takes in a prompt, uses claude code SDK to write code. But currently, it directly modifies my websites code by adding it as a page. The next task we are going to work on is making the code gen happen in an isolated environment and opening the dev server there.
- We have created a way to create sandboxes using daytona and preview them in using the getPreviewLink() function. The script scripts/test-preview-url.ts confirms this.
 - We have working oc registry and not tested yet but implemented open component creation instead of next js apps.
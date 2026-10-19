# Roblox Asset Preview

Hover a Roblox asset ID in a Luau file to see what it is, without opening Studio or the Creator Store.

## Features

- **Thumbnails.** Images, decals, meshes and models show their thumbnail, name, type and creator.
- **Sounds and animations.** These have no real thumbnail on Roblox, so they show an icon with the name, type and creator instead.
- **Missing assets.** Private, deleted or moderated assets say so, so you can spot a broken ID right away.
- **Quick links.** Every hover has links to open the asset on the Creator Store and to copy its ID.
- **Light on requests.** Each ID is looked up once per session, so hovering it again is instant.

It recognizes these formats in `.luau` and `.lua` files:

```lua
"rbxassetid://9649923610"
"http://www.roblox.com/asset/?id=9649923610"
"rbxthumb://type=Asset&id=9649923610&w=150&h=150"
```

## How it works

It uses Roblox's public thumbnails and asset details APIs. No API key or sign-in is needed, and only the asset ID you hover is sent.

## Install

Grab the `.vsix` from [Releases](https://github.com/cutiekei/roblox-asset-preview/releases), then either:

- run `code --install-extension roblox-asset-preview-0.1.0.vsix` (use `cursor` instead of `code` for Cursor), or
- open the Extensions panel, open its `...` menu, and choose **Install from VSIX...**

## Build from source

```sh
npx @vscode/vsce package
```

This writes `roblox-asset-preview-<version>.vsix` to the repo folder.

## License

MIT

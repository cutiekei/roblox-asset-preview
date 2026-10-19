const vscode = require("vscode")

const ASSET_PATTERN =
	/rbxassetid:\/\/(\d+)|(?:https?:\/\/)?(?:www\.)?roblox\.com\/asset\/?\?id=(\d+)|rbxthumb:\/\/type=Asset&id=(\d+)(?:&\w+=\w+)*/
const COPY_COMMAND = "robloxAssetPreview.copyId"
const REQUEST_TIMEOUT = 5000
const THUMBNAIL_SIZE = 160
const TYPE_NAMES = {
	1: "Image",
	3: "Audio",
	4: "Mesh",
	5: "Script",
	9: "Place",
	10: "Model",
	13: "Decal",
	21: "Badge",
	24: "Animation",
	34: "Game Pass",
	38: "Plugin",
	40: "Mesh Part",
	61: "Emote",
	62: "Video",
	73: "Font",
}
// roblox only has a generic placeholder thumbnail for these
const TYPE_ICONS = { 3: "unmute", 5: "file-code", 24: "play", 61: "play" }

// each id is looked up once per session, so hovering it again is instant
const lookups = new Map()

async function fetchJson(url) {
	const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT) })
	// private, deleted and moderated assets have no details
	if (response.status === 400 || response.status === 404) return undefined
	if (!response.ok) throw new Error(`Roblox returned ${response.status}`)
	return response.json()
}

async function lookUpAsset(id) {
	const [details, thumbnails] = await Promise.all([
		fetchJson(`https://economy.roblox.com/v2/assets/${id}/details`),
		fetchJson(`https://thumbnails.roblox.com/v1/assets?assetIds=${id}&size=420x420&format=Png`),
	])
	const thumbnail = thumbnails?.data[0]
	return {
		details,
		imageUrl: thumbnail?.state === "Completed" ? thumbnail.imageUrl : undefined,
		isPending: thumbnail?.state === "Pending",
	}
}

function getAsset(id) {
	if (lookups.has(id)) return lookups.get(id)

	const lookup = lookUpAsset(id)
	lookups.set(id, lookup)
	// failed requests and thumbnails roblox is still generating get another try on the next hover
	lookup.then(
		(asset) => asset.isPending && lookups.delete(id),
		() => lookups.delete(id)
	)
	return lookup
}

function createHover(id, asset, error) {
	const markdown = new vscode.MarkdownString("", true)
	markdown.isTrusted = { enabledCommands: [COPY_COMMAND] }
	const copyLink = `[Copy ID](command:${COPY_COMMAND}?${encodeURIComponent(JSON.stringify([id]))})`

	if (!asset?.details) {
		markdown.appendMarkdown(`**Asset ${id}**  \n`)
		markdown.appendMarkdown(error ? "Couldn't reach Roblox" : "Private, deleted or moderated")
		markdown.appendMarkdown(`\n\n---\n\n${copyLink}`)
		return markdown
	}

	const { Name: name, AssetTypeId: typeId, Creator: creator } = asset.details
	const icon = TYPE_ICONS[typeId]
	if (asset.imageUrl && !icon) {
		markdown.appendMarkdown(`![](${asset.imageUrl}|width=${THUMBNAIL_SIZE},height=${THUMBNAIL_SIZE})\n\n`)
	}
	// names come from other creators, so they go in as text and never as markdown
	markdown.appendMarkdown(icon ? `$(${icon}) **` : "**")
	markdown.appendText(name)
	markdown.appendMarkdown(`**  \n${TYPE_NAMES[typeId] ?? "Asset"} · by `)
	markdown.appendText(creator.Name)
	markdown.appendMarkdown(`\n\n---\n\n[Open on Creator Store](https://create.roblox.com/store/asset/${id}) · ${copyLink}`)
	return markdown
}

async function provideHover(document, position) {
	const range = document.getWordRangeAtPosition(position, ASSET_PATTERN)
	if (!range) return

	const match = document.getText(range).match(ASSET_PATTERN)
	const id = match.slice(1).find(Boolean)
	try {
		return new vscode.Hover(createHover(id, await getAsset(id)), range)
	} catch (error) {
		return new vscode.Hover(createHover(id, undefined, error), range)
	}
}

function activate(context) {
	context.subscriptions.push(
		vscode.languages.registerHoverProvider([{ language: "luau" }, { language: "lua" }], { provideHover }),
		vscode.commands.registerCommand(COPY_COMMAND, async (id) => {
			await vscode.env.clipboard.writeText(id)
			vscode.window.setStatusBarMessage(`Copied asset ID ${id}`, 2000)
		})
	)
}

module.exports = { activate }

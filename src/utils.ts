function addTemporaryClass(element: HTMLElement | string, className: string, removalDelay: number) {
	dojo.addClass(element, className)
	setTimeout(() => dojo.removeClass(element, className), removalDelay)
}

function removeClass(className: string, rootNode?: HTMLElement | Document): void {
	if (!rootNode) rootNode = document
	else rootNode = rootNode as HTMLElement
	rootNode.querySelectorAll('.' + className).forEach((item) => item.classList.remove(className))
}

/*
 * Detect if spectator or replay
 */
function isReadOnly() {
	return this.isSpectator || typeof (this as any).g_replayFrom != 'undefined' || (this as any).g_archive_mode
}

function getPart(haystack: string, i: number, noException: boolean = false): string {
	const parts: string[] = haystack.split('-')
	const len: number = parts.length

	if (noException && i >= len) {
		return ''
	}
	if (noException && len + i < 0) {
		return ''
	}
	return parts[i >= 0 ? i : len + i]
}

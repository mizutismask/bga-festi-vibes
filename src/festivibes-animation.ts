/**
 * Base class for animations.
 */
abstract class FestivibesAnimation {
	protected zoom: number;

	constructor(protected game: FestivibesGame) {
		this.zoom = this.game.getZoom();
	}

	public abstract animate(): Promise<FestivibesAnimation>;
}

const DRAG_AUTO_ZOOM_DELAY = 2000;

const MAP_WIDTH = 1744;
const MAP_HEIGHT = 1321;
const DECK_WIDTH = 0;
const PLAYER_WIDTH = 305;
const PLAYER_HEIGHT =150; // avg height (4 destination cards)

const BOTTOM_RATIO = (MAP_WIDTH + DECK_WIDTH) / (MAP_HEIGHT + PLAYER_HEIGHT);
const LEFT_RATIO = (PLAYER_WIDTH + MAP_WIDTH + DECK_WIDTH) / MAP_HEIGHT;

/**
 * Manager for in-map zoom.
 */
class InMapZoomManager {
    private mapZoomDiv: HTMLDivElement;
    private mapDiv: HTMLDivElement;
    private pos = { dragging: false, top: 0, left: 0, x: 0, y: 0 }; // for map drag (if zoomed)
    private zoomed = false; // indicates if in-map zoom is active

    private autoZoomTimeout: number;
    private dragClientX: number;
    private dragClientY: number;

    constructor() {
        this.mapZoomDiv = document.getElementById('map-zoom') as HTMLDivElement;
        this.mapDiv = document.getElementById('map') as HTMLDivElement;
        // Attach the handler
        this.mapDiv.addEventListener('mousedown', (e) => this.mouseDownHandler(e));
        document.addEventListener('mousemove', (e) => this.mouseMoveHandler(e));
        document.addEventListener('mouseup', (e) => this.mouseUpHandler());
        document.getElementById('zoom-button').addEventListener('click', () => this.toggleZoom());

        this.mapDiv.addEventListener('dragover', (e) => {
            if (e.offsetX !== this.dragClientX || e.offsetY !== this.dragClientY) {
                this.dragClientX = e.offsetX;
                this.dragClientY = e.offsetY;
                this.dragOverMouseMoved(e.offsetX, e.offsetY);
            }
        });
        this.mapDiv.addEventListener('dragleave', (e) => {
            clearTimeout(this.autoZoomTimeout);
            this.autoZoomTimeout = null;
        });
        this.mapDiv.addEventListener('drop', (e) => {
            clearTimeout(this.autoZoomTimeout);
            this.autoZoomTimeout = null;
        });
    }

    private dragOverMouseMoved(clientX: number, clientY: number) {
        if (this.autoZoomTimeout) {
            clearTimeout(this.autoZoomTimeout);
        }
        this.autoZoomTimeout = setTimeout(() => {
            
                // do not automatically change the zoom when player is dragging over a route!
                this.toggleZoom(clientX / this.mapDiv.clientWidth, clientY / this.mapDiv.clientHeight);
            
            this.autoZoomTimeout = null;
        }, DRAG_AUTO_ZOOM_DELAY);
    }

    /**
     * Handle click on zoom button. Toggle between full map and in-map zoom.
     */
    private toggleZoom(scrollRatioX: number = null, scrollRatioY: number = null) {
        this.zoomed = !this.zoomed;
        this.mapDiv.style.transform = this.zoomed ? `scale(1.8)` : '';
        dojo.toggleClass('zoom-button', 'zoomed', this.zoomed);
        dojo.toggleClass('map-zoom', 'scrollable', this.zoomed);

        this.mapDiv.style.cursor = this.zoomed ? 'grab' : 'default';

        if (this.zoomed) {
            if (scrollRatioX && scrollRatioY) {
                this.mapZoomDiv.scrollLeft = (this.mapZoomDiv.scrollWidth - this.mapZoomDiv.clientWidth) * scrollRatioX;
                this.mapZoomDiv.scrollTop =
                    (this.mapZoomDiv.scrollHeight - this.mapZoomDiv.clientHeight) * scrollRatioY;
            }
        } else {
            this.mapZoomDiv.scrollTop = 0;
            this.mapZoomDiv.scrollLeft = 0;
        }
    }

    /**
     * Handle mouse down, to grap map and scroll in it (imitate mobile touch scroll).
     */
    private mouseDownHandler(e: MouseEvent) {
        if (!this.zoomed) {
            return;
        }
        this.mapDiv.style.cursor = 'grabbing';

        this.pos = {
            dragging: true,
            left: this.mapDiv.scrollLeft,
            top: this.mapDiv.scrollTop,
            // Get the current mouse position
            x: e.clientX,
            y: e.clientY,
        };
    }

    /**
     * Handle mouse move, to grap map and scroll in it (imitate mobile touch scroll).
     */
    private mouseMoveHandler(e: MouseEvent) {
        if (!this.zoomed || !this.pos.dragging) {
            return;
        }

        // How far the mouse has been moved
        const dx = e.clientX - this.pos.x;
        const dy = e.clientY - this.pos.y;

        const factor = 0.1;

        // Scroll the element
        this.mapZoomDiv.scrollTop -= dy * factor;
        this.mapZoomDiv.scrollLeft -= dx * factor;
    }

    /**
     * Handle mouse up, to grap map and scroll in it (imitate mobile touch scroll).
     */
    private mouseUpHandler() {
        if (!this.zoomed || !this.pos.dragging) {
            return;
        }

        this.mapDiv.style.cursor = 'grab';
        this.pos.dragging = false;
    }

}

/**
 * Map creation and in-map zoom handler.
 */
class TtrMap {
    private scale: number;
    private inMapZoomManager: InMapZoomManager;
    private resizedDiv: HTMLDivElement;
    private mapDiv: HTMLDivElement;

    /**
     * Place map illustration and other objects, and bind events.
     */
    constructor(
        private game: FestivibesGame,
    ) {
        // map border
        dojo.place(
            `
            <div id="cities"></div>
        `,
            'map',
            'first'
        );

        this.resizedDiv = document.getElementById('resized') as HTMLDivElement;
        this.mapDiv = document.getElementById('map') as HTMLDivElement;

        this.inMapZoomManager = new InMapZoomManager();
    }

   
    /**
     * Set map size, depending on available screen size.
     */
    public setAutoZoom() {
        if (!this.mapDiv.clientWidth) {
            setTimeout(() => this.setAutoZoom(), 200);
            return;
        }
        const gameWidth =  MAP_WIDTH + DECK_WIDTH;
        const gameHeight = MAP_HEIGHT + ( PLAYER_HEIGHT * 0.75);

        const horizontalScale = document.getElementById('game_play_area').clientWidth / gameWidth;
        const verticalScale = (window.innerHeight - 80) / gameHeight;
        this.scale = Math.min(1, horizontalScale, verticalScale);

        this.resizedDiv.style.transform = this.scale === 1 ? '' : `scale(${this.scale})`;
        this.resizedDiv.style.marginBottom = `-${(1 - this.scale) * gameHeight}px`;
    }

    /**
     * Get current zoom.
     */
    public getZoom(): number {
        return this.scale;
    }
}

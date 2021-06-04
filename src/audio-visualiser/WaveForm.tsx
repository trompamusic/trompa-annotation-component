import React, {Component} from 'react';
import WaveSurfer from 'wavesurfer.js';
// Typescript types are not currenty working for plugins. See https://github.com/katspaugh/wavesurfer.js/issues/2038
// @ts-ignore
import RegionsPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.regions';
// @ts-ignore
import TimelinePlugin from 'wavesurfer.js/dist/plugin/wavesurfer.timeline';
// @ts-ignore
import CursorPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.cursor';
import {randomColor} from '../utils';
import _throttle from 'lodash.throttle';
import './Waveform.css';

type WaveformProps = {
    resourceURL: string;
    initialRegions: TrompaAnnotationComponents.RegionInterchangeFormat[];
    updateRegion: (region: TrompaAnnotationComponents.Region) => void;
    selectRegion: (region: TrompaAnnotationComponents.Region) => void;
    deleteRegion: (region: TrompaAnnotationComponents.Region) => void;
    createRegion: (region: TrompaAnnotationComponents.Region) => void;
}
type WaveformState = {
    playing: boolean;
    selectedRegionId?: string;
    start?: number;
    end?: number;
}

class Waveform extends Component<WaveformProps, WaveformState> {

    private form = React.createRef<HTMLFormElement>();
    wavesurfer?: WaveSurfer;
    throttledUpdateRegion: (region: TrompaAnnotationComponents.Region) => void;
    throttledSelectRegion: (region: TrompaAnnotationComponents.Region) => void;
    throttledDeleteRegion: (region: TrompaAnnotationComponents.Region) => void;
    throttledCreateRegion: (region: TrompaAnnotationComponents.Region) => void;

    constructor(props: WaveformProps) {
        super(props);
        this.state = {
            playing: false,
        };
        this.form = React.createRef();
        this.throttledUpdateRegion = _throttle(props.updateRegion, 1000, {leading: false});
        this.throttledDeleteRegion = _throttle(props.deleteRegion, 1000, {leading: false});
        this.throttledSelectRegion = _throttle(props.selectRegion, 250, {leading: false});
        this.throttledCreateRegion = _throttle(props.createRegion, 250, {leading: false});
    }

    componentDidMount = () => {
        const {initialRegions,} = this.props;
        this.wavesurfer = WaveSurfer.create({
            barWidth: 1,
            cursorWidth: 1,
            container: '#waveform',
            backend: 'WebAudio',
            height: 80,
            interact: true,
            progressColor: '#2D5BFF',
            responsive: true,
            waveColor: '#EFEFEF',
            cursorColor: 'transparent',
            plugins: [
                RegionsPlugin.create(
                    {
                        regions: initialRegions,
                        dragSelection: {
                            slop: 0
                        }
                    }
                ),
                TimelinePlugin.create({
                    container: '#wave-timeline'
                }),
                CursorPlugin.create({
                    showTime: true,
                    customShowTimeStyle: {bottom: 0}
                })
            ]
        });
        const track: HTMLAudioElement | null = document.querySelector('#track');

        if (track) {
            this.wavesurfer.load(track);
        }

        this.wavesurfer.on('ready', () => {
            // Create new regions on drag
            this.wavesurfer?.enableDragSelection({
                color: randomColor(0.1)
            });
        });

        this.wavesurfer.on('region-click', function (region: WaveSurfer, e: MouseEvent) {
            e?.stopPropagation();
            // Play on click, loop on shift click
            e?.shiftKey ? region.playLoop() : region.play();
        });
        this.wavesurfer.on('region-click', this.throttledSelectRegion);
        this.wavesurfer.on('region-created', this.throttledCreateRegion);
        this.wavesurfer.on('region-updated', this.throttledUpdateRegion);
        this.wavesurfer.on('region-removed', this.throttledDeleteRegion);
        // this.wavesurfer.on('region-in', this.throttledSelectRegion);
        // this.wavesurfer.on('region-out', this.deselectRegion);

        this.wavesurfer.on('region-play', (region: WaveSurfer) => {
            region.once('out', () => {
                this.wavesurfer?.play(region.start);
                this.wavesurfer?.pause();
            });
        });

        this.wavesurfer.on('play', () => {
            this.setState({playing: true});
        });
        this.wavesurfer.on('pause', () => {
            this.setState({playing: false});
        });
        this.wavesurfer.drawer.on('dblclick', this.doubleClick);
    };


    doubleClick = (event: MouseEvent) => {
        const clickPosition = this.wavesurfer?.drawer.handleEvent(event, true);
        //@ts-ignore I know getRegionSnapToGridValue exists on the utils object
        const computedStartTime = this.wavesurfer?.regions.util.getRegionSnapToGridValue(clickPosition * this.wavesurfer.getDuration());
        const computedStartTimeFloat = Number(computedStartTime).toPrecision(2);
        const region = {
            start: computedStartTimeFloat,
            end: computedStartTimeFloat,
            resize: false,
        };
        this.wavesurfer?.addRegion(region);
    }


    /** Load regions fetched from API */
    loadRegions = (regions: TrompaAnnotationComponents.RegionInterchangeFormat[]) => {
        regions.forEach((region) => {
            // region.color = randomColor(0.1);
            this.wavesurfer?.addRegion(region);
        });
    }

    createNewRegion = () => {
        this.wavesurfer?.addRegion({});
    }

    updateRegionInWaveSurfer = (region: TrompaAnnotationComponents.RegionInterchangeFormat) => {
        const {id, start, end} = region
        if (this.wavesurfer) {
            const selectedRegion = this.wavesurfer.regions.list[id];
            if (selectedRegion) {
                const isPunctual = start === end;
                selectedRegion.update({
                    start,
                    end,
                    resize: isPunctual ? false : true
                });
                console.log("Region saved in wavesurfer:", selectedRegion);
            } else {
                console.error("No region with id", id);
            }
        }
    }

    deleteRegionInWaveSurfer = (annotationId: string) => {
        const selectedRegion = this.wavesurfer?.regions.list[annotationId];
        if (!selectedRegion) {
            return;
        }
        selectedRegion.remove();
    }

    selectRegionInWaveSurfer = (annotationId: string) => {
        const selectedRegion = this.wavesurfer?.regions.list[annotationId];
        if (!selectedRegion) {
            return;
        }
        if (!isNaN(selectedRegion.start)) {
            this.wavesurfer?.fireEvent('region-click', selectedRegion);
        }
    }


    handlePlay = () => {
        const isPlaying = this.wavesurfer?.isPlaying();
        if (isPlaying) {
            this.wavesurfer?.pause();
        } else {
            this.wavesurfer?.play();
        }
        this.setState({playing: !Boolean(isPlaying)});
    };

    render() {
        const {resourceURL} = this.props;
        return (
            <div id="waveformContainer">
                <button className="playButton" onClick={this.handlePlay}>
                    <i className={this.state.playing ? 'pause-button' : 'play-button'} title="Play/Pause"></i>
                </button>
                <div id="waveform-and-plugins">
                    <div id="waveform"/>
                    <div id="wave-timeline"/>
                </div>
                <audio id="track" src={resourceURL}/>
                <small>Click and drag to create a range annotation, double click to create a punctual annotation</small>
            </div>
        );
    }

};

export default Waveform;

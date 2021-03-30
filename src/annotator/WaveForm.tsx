
import React, { Component } from 'react';
import WaveSurfer from 'wavesurfer.js';
// Typescript types are not currenty working for plugins. See https://github.com/katspaugh/wavesurfer.js/issues/2038
// @ts-ignore
import RegionsPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.regions';
// @ts-ignore
import TimelinePlugin from 'wavesurfer.js/dist/plugin/wavesurfer.timeline';
// @ts-ignore
import CursorPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.cursor';
import {randomColor} from './utils';
import _throttle from 'lodash.throttle';
import './Waveform.css';
import type { Region, RegionStub, Annotation } from '../types';

type WaveformProps ={
  resourceURL: string;
  initialRegions:RegionStub[];
  updateRegion: (region:Region)=>void;
  selectRegion: (region:Region)=>void;
  deleteRegion: (region:Region)=>void;
  createRegion: (region:Region)=>void;
}
type WaveformState = {
  playing:boolean;
  selectedRegionId?:string;
  start?:number;
  end?:number;
  data:Record<string,any>;
}

class Waveform extends Component<WaveformProps, WaveformState> {
  
  private form = React.createRef<HTMLFormElement>();
  wavesurfer?: WaveSurfer;
  throttledUpdateRegion:(region:Region)=>void;
  throttledSelectRegion:(region:Region)=>void;
  throttledDeleteRegion:(region:Region)=>void;
  throttledCreateRegion:(region:Region)=>void;
  
  constructor(props:WaveformProps){
    super(props);
    this.state = {
      playing: false,
      data:{},
    };
    this.form = React.createRef();
    this.throttledUpdateRegion = _throttle(props.updateRegion,1000,{leading:false});
    this.throttledDeleteRegion = _throttle(props.deleteRegion,1000,{leading:false});
    this.throttledSelectRegion = _throttle(props.selectRegion,250,{leading:false});
    this.throttledCreateRegion = _throttle(props.createRegion,250,{leading:false});
  }
  
  componentDidMount = () => {
    const {initialRegions, } = this.props;
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
            regions:initialRegions,
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
          customShowTimeStyle:{bottom:0}
        })
      ]
    });
    const track:HTMLAudioElement|null = document.querySelector('#track');
    
    if(track){
      this.wavesurfer.load(track);
    }
    
    this.wavesurfer.on('ready', () => {
      // Create new regions on drag
      this.wavesurfer?.enableDragSelection({
        color: randomColor(0.1)
      });
    });
    
    this.wavesurfer.on('region-click', function(region:WaveSurfer, e:MouseEvent) {
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
    
    this.wavesurfer.on('region-play', (region:WaveSurfer) => {
      region.once('out', () => {
        this.wavesurfer?.play(region.start);
        this.wavesurfer?.pause();
      });
    });
    this.wavesurfer.drawer.on('dblclick', this.doubleClick);
  };


  doubleClick = (event:MouseEvent)=> {
    const clickPosition = this.wavesurfer?.drawer.handleEvent(event, true);
    const computedStartTime = this.wavesurfer?.regions.util.getRegionSnapToGridValue(clickPosition * this.wavesurfer.getDuration());
    const computedStartTimeFloat = Math.fround(computedStartTime);
    const region = {
      start:computedStartTimeFloat,
      end:computedStartTimeFloat
    };
    this.wavesurfer?.addRegion(region);
  }
  
  /** Load regions fetched from API */
  loadRegions = (regions:Region[])=> {
    regions.forEach((region) => {
      // region.color = randomColor(0.1);
      this.wavesurfer?.addRegion(region);
    });
  }
  
  updateRegionInWaveSurfer = (region:Annotation) => {
    const {id,start,end,body} = region
    if(this.wavesurfer){
      const selectedRegion = this.wavesurfer.regions.list[id];
      selectedRegion.update({
          start,
          end,
          body
      });
      console.log("Region saved in wavesurfer:", selectedRegion);
    }
  }

  deleteRegionInWaveSurfer = (annotationId:string) => {
    const selectedRegion = this.wavesurfer?.regions.list[annotationId];
    if(!selectedRegion){
      return;
    }
    selectedRegion.remove();
  }
  
  selectRegionInWaveSurfer = (annotationId:string) => {
    const selectedRegion = this.wavesurfer?.regions.list[annotationId];
    if(!selectedRegion){
      return;
    }
    this.wavesurfer?.fireEvent('region-click', selectedRegion);
  }

  
  handlePlay = () => {
    const isPlaying = this.wavesurfer?.isPlaying();
    this.setState({ playing: Boolean(isPlaying) });
    if(isPlaying){
      this.wavesurfer?.pause();
    }
    else {
      this.wavesurfer?.play();
    }
  };
  
  render() {
    const {resourceURL} = this.props;
    return (
      <div id="waveformContainer">
        <button className="playButton" onClick={this.handlePlay} >
        {!this.state.playing ? 'Play' : 'Pause'}
        </button>
        <div id="waveform-and-plugins">
          <div id="waveform" />
          <div id="wave-timeline" />
        </div>
        <audio id="track" src={resourceURL} />
      </div>
      );
    }

};
  
export default Waveform;
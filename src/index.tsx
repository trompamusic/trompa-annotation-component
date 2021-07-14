import Annotation, {AnnotationMotivation, TimeFragmentType} from "./annotations/Annotation";
import TextArea from './annotations/TextArea';
import Rating from './annotations/Rating';
import Tags from './annotations/Tags';
import TimeSelection from "./annotations/TimeSelection";

import Waveform from './audio-visualiser/WaveForm';

import SessionViewer from "./resources/SessionViewer";
import AudioSelector from "./resources/AudioSelector";
import DefinedTermSetEditor from "./resources/DefinedTermSetEditor";
import AudioObject from "./resources/AudioObject";

import * as utilities from './utils';
import TrompaClient from "./API/CEAPI";
import SolidClient from "./API/SolidAPI";

// If you want to serve an example app, uncomment this line and run npm start
// import "./examples/App";

export {
    Annotation,
    AnnotationMotivation,
    TimeFragmentType,
    TextArea,
    Rating,
    Tags,
    Waveform,
    TimeSelection,

    SessionViewer,
    AudioSelector,
    DefinedTermSetEditor,
    AudioObject,

    TrompaClient,
    SolidClient,
    utilities
}

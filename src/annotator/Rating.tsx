
import {Component, ChangeEvent} from 'react';
import {ProgressBar} from 'react-bootstrap-v5';
import './Rating.css';

import type {RatingTemplate} from '../types'

type RatingProps = {
	handleRatingChange:(rating:number)=>void;
	rating:RatingTemplate;
}

export default class Rating extends Component<RatingProps>{

	onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
		const {handleRatingChange} = this.props;
		handleRatingChange(Number(event.target.value));
	}
	
	render(){
		const { rating } = this.props;
		const {name, ratingValue, bestRating, worstRating=1} = rating;
			
	
		return (
			<div className="form-group">
				<label htmlFor="value">{name}</label>
				<div className="form-control rangeInput">
					<input type="range" min={worstRating} max={bestRating}
						value={ratingValue} onChange={this.onInputChange} />
					<ProgressBar now={ratingValue} label={`${ratingValue}/${bestRating}`} />
				</div>
			</div>
		);
	}
}
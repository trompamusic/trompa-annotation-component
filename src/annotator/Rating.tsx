
import {Component, ChangeEvent} from 'react';
import {ProgressBar} from 'react-bootstrap-v5';
import './Rating.css';

type RatingProps = {
	onRatingChange:(rating:number)=>void;
	ratingValue?:number;
	type?: "range" | "stars";
	bestRating:number;
	worstRating:number;
	label?:string;
}

export default class Rating extends Component<RatingProps>{

	onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
		const {onRatingChange} = this.props;
		onRatingChange(Number(event.target.value));
	}
	
	getComponentFromType = () => {
		const { ratingValue, type, bestRating=5, worstRating=1 } = this.props;
		switch (type){
			case "stars":
				const filledStars:string[] = Array(ratingValue).fill('★');
				const emptyStars:string[] = Array(ratingValue).fill('☆');
				return <div style={{color:'gold', fontSize: "1.4em;"}}>
					{filledStars.join('')}{emptyStars.join('')}
					</div>;
			case "range":
			default:
				return <div className="form-control rangeInput">
					<input type="range" min={worstRating} max={bestRating}
						value={ratingValue} onChange={this.onInputChange} />
					{ratingValue &&
						<ProgressBar now={ratingValue} min={worstRating} max={bestRating} label={`${ratingValue}/${bestRating}`} />
					}
				</div>
		}
	}

	render(){
		const { label } = this.props;

		return (
			<div className="form-group">
				<label htmlFor="value">{label}</label>
				{this.getComponentFromType()}
			</div>
		);
	}
}
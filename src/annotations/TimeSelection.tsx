import React, {ChangeEvent, useState} from "react";
import {ButtonGroup, ToggleButton, Form, Row, Col} from 'react-bootstrap-v5';
import {TimeFragmentType} from "./Annotation";

type TimeSelectionProps = {
    onStartEndChange: (event: ChangeEvent<HTMLInputElement>) => void;
    onTimePeriodChange: (fragmentType: TimeFragmentType) => void;
    startValue?: number;
    endValue?: number;
    timePeriodDisabled?: boolean;
    fragmentType: TimeFragmentType;
}

export default function TimeSelection(props: TimeSelectionProps) {
    const {
        onStartEndChange, onTimePeriodChange,
        startValue, endValue,
        fragmentType, timePeriodDisabled
    } = props;

    const options = [
        {name: 'Range', value: '1'},
        {name: 'Punctual', value: '2'},
        {name: 'No time', value: '3'},
    ];

    return (
        <Row className="mb-3">
            <Col lg={6}>
                <ButtonGroup>
                    {options.map((option, idx) => (
                        <ToggleButton
                            disabled={Boolean(timePeriodDisabled)}
                            key={idx}
                            id={`radio-${idx}`}
                            type="radio"
                            variant={fragmentType === option.value ? "secondary" : "outline-secondary"}
                            name="radio"
                            value={option.value}
                            checked={fragmentType === option.value}
                            onChange={(e) => onTimePeriodChange(e.currentTarget.value as TimeFragmentType)}
                        >
                            {option.name}
                        </ToggleButton>
                    ))}
                </ButtonGroup>
            </Col>
            {fragmentType < TimeFragmentType.WHOLE &&
            <Col>
                <Form.Control type="number" name="start"
                              value={startValue || ''} step="0.5"
                              onChange={onStartEndChange}
                />
                Start
            </Col>
            }
            {fragmentType < TimeFragmentType.PUNCTUAL &&
            <Col>
                <Form.Control type="number" name="end"
                              value={endValue || ''} step="0.5"
                              onChange={onStartEndChange}
                />
                End
            </Col>
            }
        </Row>
    );
}

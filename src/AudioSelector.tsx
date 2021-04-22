import { ApolloClient, gql } from '@apollo/client';
import {ChangeEvent, Component} from "react";
import {Button, Col, Form, Row} from "react-bootstrap-v5";

const GET_ITEM = gql`
  query ThingInterface($id: ID!) {
    ThingInterface(identifier: $id) {
      __typename
      identifier
      source
      name
      title
      ... on MediaObjectInterface {
          contentUrl
      }
      ... on AudioObject {
          contentUrl
      }
    }
  }
`;

type Props = {
    apolloClient: ApolloClient<any>;
    onSelect: (node: {source:string}) => void;
};
type State = {
    nodeid: string;
    result: string;
};

export class AudioSelector extends Component<Props, State> {
    state = {
        nodeid: "7c338222-6c68-45ce-a1aa-f2a41a261520",
        result:""
    };

    onInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
        this.setState({ nodeid: e.target.value});
    };

    searchNode = async (): Promise<void> => {
        console.debug(`Hello ${this.state.nodeid}`)
        try {
            const response = await this.props.apolloClient.query({
                query: GET_ITEM,
                variables: { id: this.state.nodeid },
            });
            console.debug("Apollo response:", response);
            if (response?.data?.ThingInterface?.length) {
                this.setState({result: `You selected ${response.data.ThingInterface[0].contentUrl}`});
                // Send the resource back to the parent component
                this.props.onSelect({source: response.data.ThingInterface[0].contentUrl});
            } else {
                this.setState({result: "No item with this id"});
            }
        } catch (error) {
            this.setState({result: `Error! ${error}`});
        }
    }

    render() {
        return (
            <div>
            <Row className="align-items-center">
                <Col>
                    <Form.Group controlId="exampleForm.ControlInput1">
                        <Form.Control placeholder="CE uuid" value={this.state.nodeid} onChange={this.onInputChange} />
                    </Form.Group>
                </Col>
                <Col xs="auto">
                    <Button type="submit" className="mb-2" onClick={this.searchNode}>
                        Submit
                    </Button>
                </Col>
            </Row>
            {this.state.result}
            </div>
        )
    }
}
import {useState} from "react";
import {Nav, Navbar} from "react-bootstrap-v5";
import {
    useSession, 
    CombinedDataProvider, 
    LoginButton, 
    LogoutButton,
    Text
} from "@inrupt/solid-ui-react";

import { FOAF, VCARD } from "@inrupt/lit-generated-vocab-common";
import {Link} from "react-router-dom";
import {Button} from 'react-bootstrap-v5';



export default function Navigation() {
    const {session} = useSession();
    const [idp, setIdp] = useState("https://trompa-solid.upf.edu");
    const [currentUrl, setCurrentUrl] = useState("http://localhost:3000");
    return (
        <Navbar bg="light" expand="lg">
            <Navbar.Brand href="#home">Annotation demo</Navbar.Brand>
            <Nav className="me-auto">
                <Nav.Link as={Link} to="/">Main app</Nav.Link>
                <Nav.Link as={Link} to="/kitchensink">Kitchen Sink</Nav.Link >
                <Nav.Link as={Link} to="/editors/vocabulary">Fixed Vocabulary editor</Nav.Link>
                <Nav.Link as={Link} to="/editors/rating">Rating editor</Nav.Link>
                <Nav.Link as={Link} to="/editors/toolkit">Toolkit editor</Nav.Link>
                <Nav.Link as={Link} to="/editors/motivation">Motivation editor</Nav.Link>
            </Nav>
            <Nav>
                { session.info.isLoggedIn 
                  ? <Navbar.Text>
                    <CombinedDataProvider datasetUrl={session.info.webId!} thingUrl={session.info.webId!}>
                      Logged in: <Text property={FOAF.name.iri.value}/>
                      </CombinedDataProvider>
                    &emsp;
                    <LogoutButton><Button>Log out</Button></LogoutButton>
                    </Navbar.Text>
                  : <LoginButton oidcIssuer={idp} redirectUrl={currentUrl}>
                      <Button>Log in</Button>
                    </LoginButton>
                }
            </Nav>
        </Navbar>
    );
}

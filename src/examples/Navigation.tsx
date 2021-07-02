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
    console.debug("session info: ", session.info);
    return (
        <Navbar bg="light" expand="lg">
            <Navbar.Brand href="#home">Annotation demo</Navbar.Brand>
            <Nav className="me-auto">
                <Nav.Link>
                    <Link to="/">Main app</Link>
                </Nav.Link>
                <Nav.Link>
                    <Link to="/kitchensink">Kitchen Sink</Link>
                </Nav.Link>
                <Nav.Link>
                    <Link to="/editors/vocabulary">Fixed Vocabulary editor</Link>
                </Nav.Link>
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

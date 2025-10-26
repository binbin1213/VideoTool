import { Navbar, Container } from 'react-bootstrap';
import { FaVideo } from 'react-icons/fa';

function Header() {
  return (
    <Navbar bg="dark" variant="dark" className="header-navbar">
      <Container fluid>
        <Navbar.Brand className="d-flex align-items-center">
          <FaVideo className="me-2" size={24} />
          <span className="fw-bold">VideoTool</span>
          <span className="ms-2 text-muted small">视频处理工具</span>
        </Navbar.Brand>
        <Navbar.Text className="text-muted small">
          v1.0.0
        </Navbar.Text>
      </Container>
    </Navbar>
  );
}

export default Header;


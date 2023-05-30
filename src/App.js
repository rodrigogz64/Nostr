import { generatePrivateKey, getEventHash, getPublicKey, relayInit, signEvent } from "nostr-tools";
import { useEffect, useState } from "react";
import "./style.css"

function App() {
  const [sk, setSk] = useState(generatePrivateKey());
  const [pk, setPk] = useState(getPublicKey(sk));
  const [relay, setRelay] = useState(null);
  const [pubStatus, setPubStatus] = useState("");
  const [events, setEvents] = useState(null);
  const [input, setInput] = useState("");
  const [online, setOnline]=useState(false);

  useEffect(() => {
    const connectRelay = async () => {
      const relay = relayInit("wss://relay.damus.io");
      await relay.connect();

      relay.on("connect", () => {
        setRelay(relay);
        setOnline(true);
      });
      relay.on("error", () => {
        setOnline(false);
        console.log("failed to connect");
      });
    };

    connectRelay();
  });

  var event = {
    kind: 1,
    pubkey: pk,
    created_at: Math.floor(Date.now() / 1000),
    tags: [],
    content: input
  }

  event.id = getEventHash(event);
  event.sig = signEvent(event, sk);

  const publishEvent = (event) => {
    const pub = relay.publish(event);
    if (input === "") {
      setPubStatus("Please enter a value");
      return; // Detener la ejecución si el campo está vacío
    }
    pub.on("ok", () => {
      setPubStatus("Our event is published");
      setInput("");
    });
  
    pub.on("error", () => {
      setPubStatus("Error: Failed to publish event");
    });
  }

  const getEvents = async () => {
    var events = await relay.list([{
      kinds: [1]
    }])
    setEvents(events);
  }

  return (
    <div>
      
      {/* Navbar */}
      <div className="navbar">
        {relay ? (
          <p>Connected to {relay.url}</p>
        ) : (
          <p>Could not connect to relay</p>
        )}
        {online ? (
          <span class="indicator-dot-g"></span>
        ) : (
          <span class="indicator-dot-r"></span>
        )}

        <button className="feed" onClick={(() => getEvents())}>Feed</button>
        <button className="btn" onClick={(() => alert(`private key: ${sk} \npublic key: ${pk}`))}>
          <span><img src="https://avatars.githubusercontent.com/u/34218225?v=4" alt=""></img></span>
          <div className="npub">npub{pk}</div>
        </button> 
      </div> 
      
      {/* Create POst  */}
      <div className="container">
        <div className="publish">
          <textarea className="input"
            placeholder="Write here..."
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={6}
          />
        </div>
        <div className="btnCointainer">
          <button className="btnPost" onClick={(() => publishEvent(event))}>Publish event</button>
        </div>
      </div>

      <p style={{textAlign:"center"}}>Publish status: {pubStatus}</p>

      {/* ----------- feed -------------- */}
      
      <div className="feed-content">
        {events !== null && events.map((event) =>
          <p key={event.sig} style={{borderStyle: "ridge", padding: 10}}>{event.content}</p>
          )
        }
      </div>
    </div>
  );
}

export default App;

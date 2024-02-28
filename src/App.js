import React, { useState, useEffect } from 'react';
import moment from 'moment-timezone'; // Import moment-timezone
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc } from 'firebase/firestore'; // Import Firestore functions
import './App.css';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBQYkHpWwCcgIFq5OeTso-OCp6n-lswPH0",
  authDomain: "follow-5066f.firebaseapp.com",
  projectId: "follow-5066f",
  storageBucket: "follow-5066f.appspot.com",
  messagingSenderId: "787656319840",
  appId: "1:787656319840:web:d0a7e549c26f164a8b3405"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore(app); // Initialize Firestore

function App() {
  const [user, setUser] = useState(null);
  const [showSignedInMessage, setShowSignedInMessage] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [tickets, setTickets] = useState([]);
  const [selectedTimeZone, setSelectedTimeZone] = useState('America/Los_Angeles'); // Default time zone is PST
  const [missedCall, setMissedCall] = useState(false); // State to handle missed call question

  useEffect(() => {
    // Check if user is already signed in
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        setShowSignedInMessage(true);
        setTimeout(() => {
          setShowSignedInMessage(false);
        }, 2000);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Fetch tickets from Firestore
    const unsubscribe = onSnapshot(collection(db, 'tickets'), (snapshot) => {
      const fetchedTickets = [];
      snapshot.forEach((doc) => {
        fetchedTickets.push({ id: doc.id, ...doc.data() });
      });
      // Sort tickets
      const sortedTickets = [...fetchedTickets].sort((a, b) => {
        if (a.resolved && !b.resolved) return 1; // Resolved tickets at the bottom
        if (!a.resolved && b.resolved) return -1; // Unresolved tickets at the top
        return new Date(b.timestamp) - new Date(a.timestamp); // Sort by timestamp
      });
      setTickets(sortedTickets); // Update tickets state
    });
    return () => unsubscribe(); // Unsubscribe from Firestore listener
  }, [db]);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
      setShowSignedInMessage(true);
      setTimeout(() => {
        setShowSignedInMessage(false);
      }, 2000);
    } catch (error) {
      console.error(error.message);
    }
  };

  const handleAddTicket = async () => {
    try {
      const timestamp = moment().tz(selectedTimeZone).format(); // Get the current timestamp in the selected time zone
      const docRef = await addDoc(collection(db, 'tickets'), {
        ticketId,
        userId: user.uid,
        timestamp,
        resolved: false,
        timeZone: selectedTimeZone, // Store selected time zone with the ticket
        missedCall
      });
      console.log('Ticket added with ID: ', docRef.id);
      setTicketId('');
      setMissedCall(false);
    } catch (error) {
      console.error('Error adding ticket: ', error);
    }
  };
  
  
  

  const handleResolveTicket = async (ticketId) => {
    try {
      // Update the ticket's resolved status to true
      await updateDoc(doc(db, 'tickets', ticketId), {
        resolved: true
      });
    } catch (error) {
      console.error('Error resolving ticket: ', error);
    }
  };

  const handleAssignTicket = async (ticketId) => {
    try {
      // Update the ticket's assigned user
      await updateDoc(doc(db, 'tickets', ticketId), {
        assignedTo: user.displayName // Assign ticket to current user
      });
    } catch (error) {
      console.error('Error assigning ticket: ', error);
    }
  };

  return (
    <div>
      <h1>Welcome to the Support Panel</h1>
      {user ? (
        <div>
          {showSignedInMessage && <p>Signed In as: {user.displayName}</p>}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <input
              type="text"
              placeholder="Enter Ticket ID"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              style={{ marginRight: '10px' }}
            />
            <select
              value={selectedTimeZone}
              onChange={(e) => setSelectedTimeZone(e.target.value)}
              style={{ width: '150px' }}
            >
              <option value="America/Los_Angeles">(PST) -8</option>
              <option value="America/Denver">(MST) -7</option>
              <option value="America/Chicago">(CST) -6</option>
              <option value="America/New_York">(EST) -5</option>
            </select>
          </div>
          {/* New UI for missed call question */}
          <div className="missed-call-container">
  <p>Missed call:</p>
  <label className="missed-call-label">
    <input
      type="radio"
      value="yes"
      checked={missedCall === true}
      onChange={() => setMissedCall(true)}
    />
    <span>Yes</span>
  </label>
  <label className="missed-call-label">
    <input
      type="radio"
      value="no"
      checked={missedCall === false}
      onChange={() => setMissedCall(false)}
    />
    <span>No</span>
  </label>
</div>

          <button onClick={handleAddTicket}>Add Ticket</button>
          <ul className="ticket-list">
            {tickets.map((ticket) => (
              <li key={ticket.id} className={ticket.resolved ? 'resolved' : ''}>
                <div className="ticket-info">
                  <strong>Ticket ID:</strong> {ticket.ticketId}<br />
                  <small>{moment(ticket.timestamp).tz(ticket.timeZone).format('YY-MM-DD, HH:mm')}</small>

 {/* Display timestamp based on selected time zone */}
                </div>
                <div className="ticket-actions">
                  {/* Display phone image if missed call is true and ticket is not resolved */}
                  {ticket.missedCall && !ticket.resolved && (
                    <img src="/call.png" alt="Missed call" className="action-icon" />
                  )}
                  {!ticket.resolved && (
                    <div className="action-box">
                      <img src="/person.png" alt="Assign" onClick={() => handleAssignTicket(ticket.id)} className="action-icon" />
                      <img src="/tick.png" alt="Resolve" onClick={() => handleResolveTicket(ticket.id)} className="action-icon" />
                      {ticket.assignedTo && <p>{ticket.assignedTo}</p>}
                    </div>
                  )}
                  {ticket.resolved && ticket.assignedTo && <p className="ticket-resolved">Assigned to: {ticket.assignedTo}</p>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <button onClick={signInWithGoogle}>Sign In with Google</button>
      )}
    </div>
  );
}

export default App;

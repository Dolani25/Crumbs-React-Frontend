import { useEffect, useState } from 'react';
import './UploadFile.css'; // Reusing some styles or create new ones
// import driveIcon from './assets/google-drive.png'; // Removed missing asset

// Placeholders - USER/DEVELOPER must fill these
const DEVELOPER_KEY = 'AIzaSyCHWsOzcNX8FfR25xenb3XQMG-X65W75yA';
const CLIENT_ID = '541014598474-38hqmv8ham4suipdflhn1v4fasg73isb.apps.googleusercontent.com';
const APP_ID = 'crumbs-485020';

// Scopes for the picker to access files
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file';

function GoogleDrivePicker({ onFilePicked, onCancel }) {
    const [isApiLoaded, setIsApiLoaded] = useState(false);
    const [isAuthLoaded, setIsAuthLoaded] = useState(false);
    const [tokenClient, setTokenClient] = useState(null);
    const [pickerInited, setPickerInited] = useState(false);

    const isConfigured = CLIENT_ID !== 'YOUR_CLIENT_ID' && DEVELOPER_KEY !== 'YOUR_API_KEY';

    useEffect(() => {
        if (!isConfigured) return; // Skip loading if not configured

        // Load the Google API scripts dynamically
        const loadScripts = () => {
            const script1 = document.createElement('script');
            script1.src = 'https://apis.google.com/js/api.js';
            script1.async = true;
            script1.defer = true;
            script1.onload = () => {
                window.gapi.load('picker', { callback: onPickerApiLoad });
            };
            document.body.appendChild(script1);

            const script2 = document.createElement('script');
            script2.src = 'https://accounts.google.com/gsi/client';
            script2.async = true;
            script2.defer = true;
            script2.onload = () => {
                // Google Identity Services loaded
                try {
                    const client = window.google.accounts.oauth2.initTokenClient({
                        client_id: CLIENT_ID,
                        scope: SCOPES,
                        callback: '', // defined at request time
                    });
                    setTokenClient(client);
                    setIsAuthLoaded(true);
                } catch (e) {
                    console.error("Auth Init Error:", e);
                }
            };
            document.body.appendChild(script2);
        };

        loadScripts();
    }, [isConfigured]);

    const onPickerApiLoad = () => {
        setIsApiLoaded(true);
        setPickerInited(true);
    };

    const handleAuth = () => {
        if (!isConfigured) {
            alert("API Keys Missing. Please configure them in the code.");
            return;
        }
        if (!tokenClient) return;

        // Request an access token
        tokenClient.callback = async (response) => {
            if (response.error !== undefined) {
                throw (response);
            }
            createPicker(response.access_token);
        };

        if (window.gapi.client && window.gapi.client.getToken() === null) {
            tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            tokenClient.requestAccessToken({ prompt: '' });
        }
    };

    const createPicker = (oauthToken) => {
        if (pickerInited && oauthToken) {
            const view = new window.google.picker.View(window.google.picker.ViewId.DOCS);
            view.setMimeTypes('application/pdf'); // Filter for PDFs

            const picker = new window.google.picker.PickerBuilder()
                .enableFeature(window.google.picker.Feature.NAV_HIDDEN)
                .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
                .setAppId(APP_ID)
                .setOAuthToken(oauthToken)
                .addView(view)
                .addView(new window.google.picker.DocsUploadView())
                .setDeveloperKey(DEVELOPER_KEY)
                .setCallback((data) => pickerCallback(data, oauthToken))
                .build();
            picker.setVisible(true);
        }
    };

    const pickerCallback = async (data, oauthToken) => {
        if (data.action === window.google.picker.Action.PICKED) {
            const fileId = data.docs[0].id;
            const fileName = data.docs[0].name;
            // Token passed directly, no need for gapi.client.getToken()

            console.log('Picked file:', fileName, fileId);
            fetchContent(fileId, oauthToken, fileName);
        } else if (data.action === window.google.picker.Action.CANCEL) {
            if (onCancel) onCancel();
        }
    };

    const fetchContent = (fileId, token, fileName) => {
        fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => res.blob())
            .then(blob => {
                const file = new File([blob], fileName, { type: 'application/pdf' });
                onFilePicked(file);
            })
            .catch(err => console.error("Error downloading file from Drive", err));
    };

    return (
        <div className="filter">
            <div id="uploadBox">
                <div className="wrapper3" style={{ textAlign: 'center', minHeight: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <h3><i className="fab fa-google-drive" style={{ color: '#FE4F30', fontSize: '1.5em', marginRight: '10px' }}></i>Google Drive</h3>

                    {!isConfigured ? (
                        <div style={{ color: '#E74C3C', margin: '20px' }}>
                            <p><strong>Setup Required</strong></p>
                            <small>Valid API Keys are needed to use Google Drive.</small>
                        </div>
                    ) : (
                        <p style={{ marginBottom: '20px', color: '#666' }}>
                            {!isApiLoaded || !isAuthLoaded ? "Loading Google API..." : "Ready to connect"}
                        </p>
                    )}

                    <button
                        id="continue"
                        onClick={handleAuth}
                        disabled={!isConfigured || !isApiLoaded || !isAuthLoaded}
                        style={{ maxWidth: '200px', opacity: (!isConfigured || !isApiLoaded || !isAuthLoaded) ? 0.6 : 1 }}
                    >
                        {(!isConfigured) ? "Keys Missing" : ((!isApiLoaded || !isAuthLoaded) ? "Initializing..." : "Select from Drive")}
                    </button>

                    <button
                        style={{ marginTop: '15px', background: 'transparent', border: 'none', color: '#999', cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={onCancel}
                    >
                        Cancel
                    </button>

                    <div style={{ marginTop: '30px', fontSize: '0.8em', color: '#ccc', maxWidth: '80%' }}>
                        Note: You must add your Client ID and API Key in the code to proceed.
                    </div>
                </div>
            </div>
        </div>
    );
}

export default GoogleDrivePicker;

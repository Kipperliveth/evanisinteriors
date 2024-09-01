import React from 'react';
import { Helmet } from 'react-helmet';
import { useLocation } from 'react-router-dom';

const TawkToChat = () => {
  const location = useLocation();

  // Array of paths where TawkToChat should not be rendered
  const noChatPaths = ['/adminHome', '/orders', '/post', '/uploads', '/adminNotifications', '/adminlog' ];

  // Check if the current path is in the noChatPaths array
  const showChat = !noChatPaths.includes(location.pathname);
  
  return (
    <>
      {showChat && 
        <div>
          <Helmet>
            <script type="text/javascript">
              {`
                var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
                (function(){
                  var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
                  s1.async=true;
                  s1.src='https://embed.tawk.to/664ca1679a809f19fb3361a4/1hudld022';
                  s1.charset='UTF-8';
                  s1.setAttribute('crossorigin','*');
                  s0.parentNode.insertBefore(s1,s0);
                })();
              `}
            </script>
          </Helmet>
        </div>
      }
    </>
  );
};

export default TawkToChat;

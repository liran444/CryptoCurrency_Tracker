Core Foundations:

 1. Toggled Checkboxes' ID are saved and stored in localStorage.
    This is done under the assumption that in the most probable case, if a user wanted to view live reports on a
    specific coin on day "X", then he will also want to track the same coin again on the day he returns to the site.

 2.  Additional coin information that is retrieved in the event of clicking on the 'Show More Info' button, will be stored
     in a cache array. An imminent clean up of that information will begin right afterwards, deleting the information
     after two minutes. Once two minutes have passed, pressing the same button again will retrieve new information from the API.
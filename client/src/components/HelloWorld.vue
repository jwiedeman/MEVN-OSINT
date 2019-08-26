<template>
  <div class="hello">
    <input
      v-model="message"
      @keydown.enter="reverseMessage"
    />
    <button @click="reverseMessage">Reverse!</button>
    <p>Your reversed message: {{ reversedText }}</p>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'HelloWorld',
  data: function() {
    return {
      message: "",
      reversedText: ""
    };
  },
  methods: {
    reverseMessage() {
      // Send a request to our server, including the message in the query string
      axios.get('http://localhost:3000/message?message=' + this.message).then((response) => {
        // Takes the response we received and sets our "reversedText" variable to it
        this.reversedText = response.data;
      }).catch(error => {
        // Handle unexpected exceptions
        throw new Error(error);
      });
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>

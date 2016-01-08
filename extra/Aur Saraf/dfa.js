// Generated by CoffeeScript 1.10.0
(function() {
  var ALL, ANY, MATCH, SEPARATOR, actionsSetToActions, addGlob, addStatesSetToDFA, aggregateTransitions, calculateFree, compileGlobsDFA, compileGlobsNFA, compileRulesDFA, filter, halfRuleToGlob, intSetToKey, ruleToGlob, runDFA, runRulesDFA;

  ALL = 'ALL';

  filter = function(messages, rules) {
    var dfa, id, result;
    dfa = compileRulesDFA(rules);
    result = {};
    for (id in messages) {
      result[id] = runRulesDFA(dfa, messages[id]);
    }
    return result;
  };

  SEPARATOR = '\u0000';

  ANY = '?';

  MATCH = '*';

  runRulesDFA = function(dfa, message) {
    return runDFA(dfa, message.from + SEPARATOR + message.to);
  };

  runDFA = function(dfa, input) {
    var ch, i, j, len1, state, this_state;
    state = 0;
    for (i = j = 0, len1 = input.length; j < len1; i = ++j) {
      ch = input[i];
      this_state = dfa[state];
      if (!this_state) {
        return [];
      }
      state = this_state[ch];
      if ((state == null) && ch !== SEPARATOR) {
        state = this_state[ANY];
      }
    }
    this_state = dfa[state];
    if ((this_state != null) && (this_state[MATCH] != null)) {
      return this_state[MATCH];
    }
    return [];
  };

  compileRulesDFA = function(rules) {
    var actions, globs, rule;
    globs = (function() {
      var j, len1, results;
      results = [];
      for (j = 0, len1 = rules.length; j < len1; j++) {
        rule = rules[j];
        results.push(ruleToGlob(rule));
      }
      return results;
    })();
    actions = (function() {
      var j, len1, results;
      results = [];
      for (j = 0, len1 = rules.length; j < len1; j++) {
        rule = rules[j];
        results.push(rule.action);
      }
      return results;
    })();
    return compileGlobsDFA(globs, actions);
  };

  ruleToGlob = function(rule) {
    return halfRuleToGlob(rule.from) + SEPARATOR + halfRuleToGlob(rule.to);
  };

  halfRuleToGlob = function(half) {
    if (half == null) {
      return '*';
    }
    return half;
  };

  compileGlobsDFA = function(globs, actions) {
    var dfa, initialStateSet, j, k, len1, nfa, ref, ref1, results, state, statesIndex;
    if (globs.length === 0) {
      return [];
    }
    nfa = compileGlobsNFA(globs, (function() {
      results = [];
      for (var j = 0, ref = globs.length - 1; 0 <= ref ? j <= ref : j >= ref; 0 <= ref ? j++ : j--){ results.push(j); }
      return results;
    }).apply(this));
    dfa = [];
    statesIndex = {};
    initialStateSet = {};
    ref1 = nfa[0].free;
    for (k = 0, len1 = ref1.length; k < len1; k++) {
      state = ref1[k];
      initialStateSet[state] = true;
    }
    addStatesSetToDFA(nfa, dfa, actions, statesIndex, initialStateSet);
    return dfa;
  };

  addStatesSetToDFA = function(nfa, dfa, actions, statesIndex, statesSet) {
    var actionsSet, index, input, key, newStatesSet, node, ourIndex, ref, transition;
    key = intSetToKey(statesSet);
    if (statesIndex[key] != null) {
      return statesIndex[key];
    }
    ourIndex = statesIndex[key] = dfa.length;
    node = {};
    dfa.push(node);
    ref = aggregateTransitions(nfa, statesSet), transition = ref[0], actionsSet = ref[1];
    for (input in transition) {
      newStatesSet = transition[input];
      index = addStatesSetToDFA(nfa, dfa, actions, statesIndex, newStatesSet);
      node[input] = index;
    }
    node[MATCH] = actionsSetToActions(actionsSet, actions);
    return ourIndex;
  };

  intSetToKey = function(statesSet) {
    var match, states;
    states = (function() {
      var results;
      results = [];
      for (match in statesSet) {
        results.push(match);
      }
      return results;
    })();
    return states.sort().join(',');
  };

  actionsSetToActions = function(actionsSet, actions) {
    var i, index, indexes, j, len1, ref, results;
    indexes = (function() {
      var results;
      results = [];
      for (index in actionsSet) {
        results.push(index);
      }
      return results;
    })();
    ref = indexes.sort();
    results = [];
    for (j = 0, len1 = ref.length; j < len1; j++) {
      i = ref[j];
      results.push(actions[i]);
    }
    return results;
  };

  aggregateTransitions = function(nfa, statesSet) {
    var actionsSet, input, inputNextStatesSet, j, len1, reachableState, ref, ref1, state, transition, value;
    transition = {};
    actionsSet = {};
    for (state in statesSet) {
      ref = nfa[state];
      for (input in ref) {
        value = ref[input];
        if (input === 'free') {
          continue;
        }
        if (input === MATCH) {
          actionsSet[value] = true;
          continue;
        }
        inputNextStatesSet = transition[input] != null ? transition[input] : transition[input] = {};
        ref1 = nfa[value].free;
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          reachableState = ref1[j];
          inputNextStatesSet[reachableState] = true;
        }
      }
    }
    if (transition[ANY] != null) {
      for (input in transition) {
        inputNextStatesSet = transition[input];
        if (input !== ANY && input !== SEPARATOR) {
          for (reachableState in transition[ANY]) {
            inputNextStatesSet[reachableState] = true;
          }
        }
      }
    }
    return [transition, actionsSet];
  };

  compileGlobsNFA = function(globs, actions) {
    var glob, globIndex, j, len1, nfa;
    nfa = [
      {
        '_free': []
      }
    ];
    for (globIndex = j = 0, len1 = globs.length; j < len1; globIndex = ++j) {
      glob = globs[globIndex];
      addGlob(nfa, glob, actions[globIndex]);
    }
    calculateFree(nfa);
    return nfa;
  };

  addGlob = function(nfa, glob, action) {
    var ch, i, len, obj;
    nfa[0]['_free'].push(nfa.length);
    i = 0;
    len = glob.length;
    while (i < len) {
      ch = glob[i];
      if (ch === '*') {
        while (i < len && glob[i + 1] === '*') {
          i++;
        }
        nfa.push({
          '?': nfa.length,
          '_free': [nfa.length + 1]
        });
      } else {
        nfa.push((
          obj = {},
          obj["" + ch] = nfa.length + 1,
          obj
        ));
      }
      i++;
    }
    return nfa.push({
      '*': action
    });
  };

  calculateFree = function(nfa) {
    var _free, connected, freeSet, freeState, i, j, k, l, len1, len2, ref, ref1, results, state;
    results = [];
    for (i = j = ref = nfa.length - 1; j >= 0; i = j += -1) {
      freeSet = {};
      freeSet[i] = true;
      _free = nfa[i]._free;
      if (_free != null) {
        for (k = 0, len1 = _free.length; k < len1; k++) {
          connected = _free[k];
          ref1 = nfa[connected].free;
          for (l = 0, len2 = ref1.length; l < len2; l++) {
            freeState = ref1[l];
            freeSet[freeState] = true;
          }
        }
        delete nfa[i]._free;
      }
      results.push(nfa[i].free = (function() {
        var results1;
        results1 = [];
        for (state in freeSet) {
          results1.push(+state);
        }
        return results1;
      })());
    }
    return results;
  };

  module.exports = {
    filter: filter
  };

}).call(this);
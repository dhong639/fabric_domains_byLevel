class ReachabilityMatrix {
	constructor(edges, root) {
		this.levels = {}
		this.links_child = {}
		this.links_parent = {}
		this.links_intra = {}
		this.domains = {}

		this.root = root
		this.graph = {}
		edges.forEach(edge => {
			var source_id = edge[0]
			var target_id = edge[1]
			var source_intf = edge[2]
			var target_intf = edge[3]
			this.add_edge(source_id, target_id, source_intf, target_intf)
			this.add_edge(target_id, source_id, target_intf, source_intf)
		})
		this.breadthFirst_byLevel()
		this.assign_domains()
	}
	add_edge(source_id, target_id, source_intf, target_intf) {
		if(source_id in this.graph == false) {
			this.graph[source_id] = {}
		}
		if(target_id in this.graph[source_id] == false) {
			this.graph[source_id][target_id] = {}
		}
		this.graph[source_id][target_id][source_intf] = [target_intf, true]
	}
	del_edge(source_id, target_id, source_intf, target_intf) {
		if(this.graph[source_id][target_id][source_intf][0] == target_intf) {
			delete this.graph[source_id][target_id][source_intf]
		}
		if(Object.keys(this.graph[source_id][target_id]).length > 0 == false) {
			delete this.graph[source_id][target_id]
		}
	}
	get_nodes() {
		var nodes = Object.keys(this.graph)
		nodes.sort()
		return nodes
	}
	get_levels() {
		var levels = new Set()
		for(var node_id in this.levels) {
			levels.add(this.levels[node_id])
		}
		levels = Array.from(levels)
		levels.sort()
		return levels
	}
	get_segment(start_id) {
		var output = new Set()
		var visited = new Set()
		var curr = new Set([start_id])
		while(curr.size > 0) {
			var next = new Set()
			curr.forEach(source_id => {
				for(var target_id in this.graph[source_id]) {
					if(curr.has(target_id) == false && visited.has(target_id) == false) {
						if(this.levels[source_id] < this.levels[target_id]) {
							next.add(target_id)
						}
					}
				}
				visited.add(source_id)
				output.add(source_id)
			})
			curr.clear()
			next.forEach(node_id => {
				curr.add(node_id)
			})
		}
		return output
	}
	get_domainHead(node_id) {
		var curr = new Set([node_id])
		var level = this.levels[node_id]
		while(level > 1) {
			var next = new Set()
			curr.forEach(source_id => {
				this.links_parent[level][source_id].forEach(target_id => {
					next.add(target_id)
				})
			})
			curr.clear()
			next.forEach(node_id => {
				curr.add(node_id)
			})
			level -= 1
		}
		return level == 1 ? curr : new Set()
	}
	get_domains() {
		var domains = Object.keys(this.domains)
		domains.sort()
		return domains
	}
	has_link(source_id, target_id, source_intf, target_intf) {
		var has_link = false
		if(source_id in this.graph) {
			if(target_id in this.graph[source_id]) {
				if(source_intf in this.graph[source_id][target_id]) {
					if(this.graph[source_id][target_id][source_intf][0] == target_intf) {
						has_link = true
					}
				}
			}
		}
		return has_link
	}
	intf_isConnected(source_id, source_intf) {
		var intf_isConnected = false
		for(var target_id in this.graph[source_id]) {
			if(source_intf in this.graph[source_id][target_id]) {
				intf_isConnected = true
			}
		}
		return intf_isConnected
	}
	get_list_intfPair(source_id, target_id) {
		var output = []
		for(var source_intf in this.graph[source_id][target_id]) {
			var target_intf = this.graph[source_id][target_id][source_intf][0]
			output.push([source_intf, target_intf])
		}
		return output
	}
	breadthFirst_byLevel() {
		this.levels = {}
		
		this.links_child = {}
		this.links_parent = {}
		this.links_intra = {}

		var visited = new Set()
		var level = 0
		var curr = new Set([this.root])
		while(curr.size > 0) {
			var next = new Set()
			curr.forEach(source_id => {
				for(var target_id in this.graph[source_id]) {
					if(curr.has(target_id) == true && source_id != target_id) {
						this.add_tableEntry(this.links_intra, level, source_id, target_id)
						this.add_tableEntry(this.links_intra, level, target_id, source_id)
					}
					if(visited.has(target_id) == false && curr.has(target_id) == false) {
						next.add(target_id)
						this.add_tableEntry(this.links_child, level, source_id, target_id)
						this.add_tableEntry(this.links_parent, level + 1, target_id, source_id)
					}
				}
				this.levels[source_id] = level
				visited.add(source_id)
			})
			curr.clear()
			next.forEach(node => {
				curr.add(node)
			})
			level += 1
		}
	}
	assign_domains() {
		this.domains = {}
		for(target_id in this.graph[this.root]) {
			this.domains[target_id] = this.get_segment(target_id)
		}
		var visited = new Set()
		for(var source_id in this.domains) {
			var set_source = this.domains[source_id]
			for(var target_id in this.domains) {
				if(visited.has(target_id) == false) {
					var set_target = this.domains[target_id]
					var intersection_source = [...set_source].filter(node => set_target.has(node))
					var intersection_target = [...set_target].filter(node => set_source.has(node))
					if(intersection_source.length > 0 || intersection_target.length > 0) {
						this.domains[source_id].forEach(node => {
							this.domains[target_id].add(node)
						})
						this.domains[target_id].forEach(node => {
							this.domains[source_id].add(node)
						})
					}
				}
			}
		}
		//console.log(this.domains)
	}
	add_tableEntry(table, level, source_id, target_id) {
		if(level in table == false) {
			table[level] = {}
		}
		if(source_id in table[level] == false) {
			table[level][source_id] = new Set()
		}
		table[level][source_id].add(target_id)
	}
	del_tableEntry(table, level, source_id, target_id) {
		table[level][source_id].delete(target_id)
		if(table[level][source_id].size > 0 == false) {
			delete table[level][source_id]
		}
		if(Object.keys(table[level]).length > 0 == false) {
			delete table[level]
		}
	}
	add_link(source_id, target_id, source_intf, target_intf) {
		var heads_old = this.helper_domain_forLink(source_id, target_id);
		//console.log(heads_old)
		var connected_source = this.intf_isConnected(source_id, source_intf)
		var connected_target = this.intf_isConnected(target_id, target_intf)
		/*console.log(connected_source)
		console.log(connected_target)*/
		if(connected_source == true && connected_target == true) {
			/*console.log(this.graph[source_id][target_id][source_intf])
			console.log(this.graph[target_id][source_id][target_intf])
			console.log(Object.keys(this.graph[target_id][source_id]))
			console.log(target_intf)
			console.log(Object.keys(this.graph[target_id][source_id])[0] == target_intf)*/
			this.graph[source_id][target_id][source_intf][1] = true
			this.graph[target_id][source_id][target_intf][1] = true
		}
		else if(connected_source == false && connected_target == false){
			this.add_edge(source_id, target_id, source_intf, target_intf)
			this.add_edge(target_id, source_id, target_intf, source_intf)
			this.breadthFirst_byLevel()
			var heads_new = this.helper_domain_forLink(source_id, target_id)
			//console.log(heads_new)
			var is_domainChange = false
			for(var node_id in heads_old) {
				if(isEqual_set(heads_old[node_id], heads_new[node_id]) == false) {
					is_domainChange = true
				}
			}
			//console.log(is_domainChange)
			if(is_domainChange == true) {
				this.assign_domains()
			}
		}
	}
	del_link(source_id, target_id, source_intf, target_intf) {
		if(this.has_link(source_id, target_id, source_intf, target_intf)) {
			var heads_old = this.helper_domain_forLink(source_id, target_id)
			//console.log(heads_old)
			var segment_target = this.get_segment(target_id)
			var level = this.levels[target_id]
			var has_adjacent = this.links_parent[level][target_id].size > 1
			//console.log(this.links_parent[level][target_id])
			segment_target.forEach(segment_node => {
				var level = this.levels[segment_node]
				var adjacent = new Set()
				if(level in this.links_parent) {
					if(segment_node in this.links_parent[level]) {
						var adjacent_vertical = this.links_parent[level][segment_node]
						adjacent_vertical.forEach(node_id => {
							if(segment_target.has(node_id) == false && node_id != source_id) {
								adjacent.add(node_id)
							}
						})
					}
				}
				if(level in this.links_intra) {
					if(segment_node in this.links_intra[level]) {
						var adjacent_horizontal = this.links_intra[level][segment_node]
						adjacent_horizontal.forEach(node_id => {
							if(segment_target.has(node_id) == false && node_id != source_id) {
								adjacent.add(node_id)
							}
						})
					}
				}
				//console.log(segment_node + '\t' + Array.from(adjacent).join(', '))
				if(adjacent.size > 0) {
					has_adjacent = true
				}
			})
			if(has_adjacent == true) {
				this.del_edge(source_id, target_id, source_intf, target_intf)
				this.del_edge(target_id, source_id, target_intf, source_intf)
				this.breadthFirst_byLevel()
				var heads_new = this.helper_domain_forLink(source_id, target_id)
				//console.log(heads_new)
				var is_domainChange = false
				for(var node_id in heads_old) {
					if(isEqual_set(heads_old[node_id], heads_new[node_id]) == false) {
						is_domainChange = true
					}
				}
				//console.log(is_domainChange)
				if(is_domainChange == true) {
					this.assign_domains()
				}
			}
			else {
				this.graph[source_id][target_id][source_intf][1] = false
				this.graph[target_id][source_id][target_intf][1] = false
				//console.log(this.graph[source_id][target_id][source_intf])
				//console.log(this.graph[target_id][source_id][target_intf])
			}
		}
	}
	helper_domain_forLink(source_id, target_id) {
		var heads = {}
		var loop_forEach = [source_id, target_id]
		loop_forEach.forEach(node_id => {
			heads[node_id] = new Set()
			this.get_domainHead(node_id).forEach(head_id => {
				heads[node_id].add(head_id)
			})
		})
		return heads
	}
}

function isEqual_set(set_a, set_b) {
	var is_equal = false
	if(set_a.size == set_b.size) {
		if([...set_a].every(x => set_b.has(x))) {
			is_equal = true
		}
	}
	return is_equal
}

/*var edges = [
	['A', 'B', 1, 1],
	['A', 'C', 2, 1],
	['A', 'D', 3, 1],
	['A', 'E', 4, 1],
	['B', 'C', 2, 2],
	['B', 'C', 5, 4],
	['D', 'E', 2, 2],
	['D', 'E', 4, 5],
	['B', 'F', 3, 1],
	['B', 'G', 4, 1],
	['C', 'H', 3, 1],
	['D', 'I', 3, 1],
	['E', 'J', 3, 1],
	['E', 'K', 4, 1],
	['G', 'H', 2, 2],
	['H', 'I', 3, 2],
	['I', 'J', 3, 2],
	['F', 'L', 2, 1],
	['F', 'L', 3, 3],
	['G', 'M', 3, 1],
	['G', 'N', 4, 1],
	['G', 'O', 5, 1],
	['H', 'O', 4, 2],
	['I', 'P', 4, 1],
	['J', 'P', 3, 2],
	['J', 'Q', 4, 1],
	['J', 'R', 5, 1],
	['K', 'S', 2, 1],
	['K', 'S', 3, 3],
	['L', 'T', 2, 1],
	['M', 'U', 2, 1],
	['N', 'V', 2, 1],
	['O', 'W', 3, 1],
	['P', 'W', 3, 2],
	['Q', 'X', 2, 1],
	['R', 'Y', 2, 1],
	['S', 'Z', 2, 1]
]
var reachabilityMatrix = new ReachabilityMatrix(edges, 'A')
console.log(reachabilityMatrix.graph)
console.log(reachabilityMatrix.links_parent)
console.log(reachabilityMatrix.links_child)*/
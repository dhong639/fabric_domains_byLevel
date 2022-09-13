function show_reset() {
	document.getElementById('show_segment').innerHTML = ''
	document.getElementById('select_segment').selectedIndex = 0
	document.getElementById('show_domainNode').innerHTML = ''
	document.getElementById('show_domainHead').innerHTML = ''
	/*remove_options('edge_delTarget')
	document.getElementById('edge_delSource').selectedIndex = 0
	remove_options('edge_addTarget')
	document.getElementById('edge_addSource').selectedIndex = 0*/

	reachability_matrix.get_nodes().forEach(node => {
		cy.$('#' + node).data({
			color: reachability_matrix.root == node ? '#6495ED' : '#98FB98',
			invert: reachability_matrix.root == node ? '#9B6A12': '#670467',
		})
	})
}

function show_segment() {
	var start = document.getElementById('select_segment').value
	show_reset()
	document.getElementById('show_segment').innerHTML = start
	if(start != '') {
		var segment = reachability_matrix.get_segment(start)
		segment.forEach(node => {
			cy.$('#' + node).data({
				color: '#DB7093',
				invert: '#248f6c'
			})
		})
	}
}

function show_domain() {
	show_reset()
	document.getElementById('show_domainNode').innerHTML = ''
	document.getElementById('show_domainHead').innerHTML = ''
	var show_domainNode = document.getElementById('select_domain').value
	document.getElementById('show_domainNode').innerHTML = show_domainNode
	var domain_heads = reachability_matrix.get_domainHead(show_domainNode)
	domain_heads.forEach(head => {
		document.getElementById('show_domainHead').innerHTML += head + '<br />'
		reachability_matrix.domains[head].forEach(node => {
			cy.$('#' + node).data({
				color: '#DB7093',
				invert: '#248f6c'
			})
		})
	})
}

function show_graph() {
	//remove_options('select_domain')
	//add_options('select_domain', reachability_matrix.get_domains())
	document.getElementById('table_type').selectedIndex = "0"
	set_table()
	cy.elements().remove()
	reachability_matrix.get_levels().forEach(level_id => {
		cy.add({
			group: 'nodes',
			data: {
				id: 'level ' + level_id,
				color: '#DCDCDC',
				invert: '#232323',
				valign: 'top',
				halign: 'center'
			}
		})
	})
	//console.log(reachability_matrix.get_nodes())
	reachability_matrix.get_nodes().forEach(node_id => {
		cy.add({
			group: 'nodes',
			data: {
				id: node_id,
				color: reachability_matrix.root == node_id ? '#6495ED' : '#98FB98',
				invert: reachability_matrix.root == node_id ? '#9B6A12': '#670467',
				parent: 'level ' + reachability_matrix.levels[node_id],
				valign: 'center',
				halign: 'center'
			}
		})
	})
	for(var level in reachability_matrix.links_child) {
		for(var source_id in reachability_matrix.links_child[level]) {
			reachability_matrix.links_child[level][source_id].forEach(target_id => {
				var list_intfPair = reachability_matrix.get_list_intfPair(source_id, target_id)
				list_intfPair.forEach(pair => {
					var is_up = reachability_matrix.graph[source_id][target_id][pair[0]][1]
					cy.add({
						group: 'edges',
						data: {
							id: source_id + '.' + pair[0] + ' ' + target_id + '.' + pair[1],
							source: source_id,
							target: target_id,
							is_up: is_up ? 'solid' : 'dashed',
							target_arrow: 'triangle',
							source_intf: pair[0],
							target_intf: pair[1]
						}
					})
				})
			})
		}
	}
	var horizontal_visited = new Set()
	for(var level in reachability_matrix.links_intra) {
		for(var source_id in reachability_matrix.links_intra[level]) {
			reachability_matrix.links_intra[level][source_id].forEach(target_id => {
				var list_intfPair = reachability_matrix.get_list_intfPair(source_id, target_id)
				list_intfPair.forEach(pair => {
					var is_up = reachability_matrix.graph[source_id][target_id][pair[0]][1]
					var edge_id = source_id + '.' + pair[0] + ' ' + target_id + '.' + pair[1]
					var reverse = target_id + '.' + pair[1] + ' ' + source_id + '.' + pair[0]
					if(!horizontal_visited.has(edge_id) && !horizontal_visited.has(reverse)) {
						cy.add({
							group: 'edges',
							data: {
								id: edge_id,
								source: source_id,
								target: target_id,
								is_up: is_up ? 'solid' : 'dashed',
								target_arrow: 'none',
								source_intf: pair[0],
								target_intf: pair[1]
							}
						})
						horizontal_visited.add(edge_id)
						horizontal_visited.add(reverse)
					}
				})
			})
		}
	}
	this.cy.layout({
		name: 'breadthfirst',
		roots: '#' + reachability_matrix.root
	}).run()
}

function edge_del() {
	var source_id = document.getElementById('edge_del_sourceID').value
	var target_id = document.getElementById('edge_del_targetID').value
	var source_intf = document.getElementById('edge_del_sourceIntf').value
	var target_intf = document.getElementById('edge_del_targetIntf').value
	//console.log(reachability_matrix.graph[source_id][target_id])
	//console.log(reachability_matrix.has_link(source_id, target_id, source_intf, target_intf))
	if(reachability_matrix.has_link(source_id, target_id, source_intf, target_intf) == true) {
		//console.log('fire')
		reachability_matrix.del_link(source_id, target_id, source_intf, target_intf)
		document.getElementById('show_segment').innerHTML = ''
		document.getElementById('select_segment').selectedIndex = 0
		document.getElementById('show_domainNode').innerHTML = ''
		document.getElementById('show_domainHead').innerHTML = ''
		show_graph()
	}
}

function edge_add() {
	var source_id = document.getElementById('edge_add_sourceID').value
	var target_id = document.getElementById('edge_add_targetID').value
	var source_intf = document.getElementById('edge_add_sourceIntf').value
	var target_intf = document.getElementById('edge_add_targetIntf').value
	reachability_matrix.add_link(source_id, target_id, source_intf, target_intf)
	document.getElementById('show_segment').innerHTML = ''
	document.getElementById('select_segment').selectedIndex = 0
	document.getElementById('show_domainNode').innerHTML = ''
	document.getElementById('show_domainHead').innerHTML = ''
	show_graph()
}

function add_options(select_id, items) {
	items.forEach(item => {
		var option = document.createElement('option')
		option.text = item
		option.value = item
		document.getElementById(select_id).add(option)
	})
}

function remove_options(select_id, count=1) {
	var select = document.getElementById(select_id)
	while(select.length > count) {
		select.remove(select.length - 1)
	}
}

function set_table() {
	var display_table = document.getElementById('display_table')
	while(display_table.rows.length > 1) {
		display_table.deleteRow(-1)
	}
	var type = parseInt(document.getElementById('table_type').value)
	if(type != 0) {
		var links = {}
		switch(type) {
			case 1: 
				links = reachability_matrix.links_intra
				break
			case 2: 
				links = reachability_matrix.links_child
				break
			case 3:
				links = reachability_matrix.links_parent
				break
			default:
				break
		}
		for(var level in links) {
			for(var source_id in links[level]) {
				links[level][source_id].forEach(target_id => {
					var list_intfPair = reachability_matrix.get_list_intfPair(source_id, target_id)
					list_intfPair.forEach(pair => {
						var row = display_table.insertRow(-1)
						var cell_level = row.insertCell(0)
						cell_level.innerHTML = level	
						var cell_sourceID = row.insertCell(1)
						cell_sourceID.innerHTML = source_id
						var cell_sourceIntf = row.insertCell(2)
						cell_sourceIntf.innerHTML = pair[0]
						var cell_targetID = row.insertCell(3)
						cell_targetID.innerHTML = target_id
						var cell_targetIntf = row.insertCell(4)
						cell_targetIntf.innerHTML = pair[1]
						var cell_active = row.insertCell(5)
						var is_active = reachability_matrix.graph[source_id][target_id][pair[0]][1]
						cell_active.innerHTML = is_active ? '&#10004' : ''
					})
				})
			}
		}
	}
}
// Get the properties of the svg container
var svg = d3.select("svg"),
    width = svg.attr("width"),
    height = svg.attr("height");


// async function, so it doesn't make sense to get return value.
d3.json("family.json", function(error, familyTreeData) {
    if (error) throw error;  
    console.log(familyTreeData);

    // Do some data pre-processing
    // Add a new property to each node, which is the scaled dob.



    // Set up the forces in the simulation
    var simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(function(d) { return d.id; }))
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(width / 2, height / 2))
        //.force("forceY", d3.forceY(function(d) { return d.dob; }));   // Just use the dob
        .force("forceY", d3.forceY(function(d) { return ((d.dob-1800)/200)*height/2.0; }))  // Scale the dob
        //.force("forceY", d3.forceY());
        .on('tick', ticked);

    //////////////////////////////
    // Tweak the forces 
    // Set this as the max value to ensure it happens.
    simulation.force("forceY")
        .strength(1)

    // Negative so repulsive.
    simulation.force("charge")
        .strength(-200)
        //.distanceMax(100) // Max distance the repulsive force is applied.

    //////////////////////////////
    // Add the data
    // Nodes - these are people
    simulation
        .nodes(familyTreeData.nodes);
    
    // Links - these are relationships
    simulation.force("link")
        .links(familyTreeData.links);
    
    //////////////////////////////
    // Attach the data to the DOM
    var node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(familyTreeData.nodes)
        .enter().append("circle")
        .attr("r", 5);  

    var link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(familyTreeData.links)
        .enter().append("line");
    
    // Add a title to each node
    node.append("title")
        .text(function(d) { return d.id.toString().concat(" ", d.name, " ", d.dob); });
  
    console.log(node)

    // Function called on each tick to redraw the nodes and links
    function ticked() {
        link
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });
    
        node
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });    
    }
    
});



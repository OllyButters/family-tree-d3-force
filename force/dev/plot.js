// Get the properties of the svg container
var svg = d3.select("svg"),
    width = svg.attr("width"),
    height = svg.attr("height");


// Add horizontal lines to represent the year
let scale = d3.scaleLinear().domain([1800, 2000]).range([0, 1000]);

let axis = d3.axisLeft(scale)
    .tickSize(1500);

d3.select('svg g.axis')
    .call(axis);


// Set up the forces in the simulation
var simulation = d3.forceSimulation();


// async function, so it doesn't make sense to get return value.
d3.json("family.json", function(error, familyTreeData) {
    if (error) throw error;  
    console.log(familyTreeData);


   // Build a list of the node ids which join the parents to the children
   // The child is always the source, the parent is always the target.
   var parents = {};
   for (var i = 0; i < familyTreeData["links"].length; i++) {
        if (typeof parents[familyTreeData["links"][i]["source"]] == 'undefined') {
            parents[familyTreeData["links"][i]["source"]] = {};
        }
        parents[familyTreeData["links"][i]["source"]]["child"]  = familyTreeData["links"][i]["source"];
        if (familyTreeData["links"][i]["relationship"] == "mother") {
            parents[familyTreeData["links"][i]["source"]]["mother"] = familyTreeData["links"][i]["target"];
        }
        if (familyTreeData["links"][i]["relationship"] == "father") {
            parents[familyTreeData["links"][i]["source"]]["father"] = familyTreeData["links"][i]["target"];
        }

   }
   console.log(parents);

    // Do some data pre-processing
    // Add a fy value to each node to force it to stay at that y position
    for (var i = 0; i < familyTreeData["nodes"].length; i++) {
        familyTreeData["nodes"][i]["fy"] = ((familyTreeData["nodes"][i]["dob"]-1800)/200)*height;
    }

    // Set up the forces in the simulation
    //var simulation = d3.forceSimulation()
    simulation
        .force("link", d3.forceLink().id(function(d) { return d.id; }))
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(width / 2, height / 2))
        //.force("center", d3.forceCenter())
        //.force("forceY", d3.forceY(function(d) { return d.dob; }));   // Just use the dob
        //.force("forceY", d3.forceY(function(d) { return ((d.dob-1800)/200)*height; }))  // Scale the dob
        //.force("forceX", d3.forceX().x(width/2))  // Try to get the nodes to the middle of the screen
        //.force("forceY", d3.forceY().y(function(d) { return ((d.dob-1800)/200)*height; }))
        .on('tick', ticked);

    //////////////////////////////
    // Tweak the forces 
    //simulation.force("forceX")
    //    .strength(0.02);


    // Set this as the max value to ensure it happens.
    //simulation.force("forceY")
    //    .strength(1);
        //.y(function(d) { return ((d.dob-1800)/200)*height; });

    // Negative so repulsive.
    simulation.force("charge")
        .strength(-500)
        .distanceMax(500); // Max distance the repulsive force is applied.

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

    var link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(familyTreeData.links)
        .enter().append("line")
        .attr("stroke", function(d) { 
            if(d.relationship == "married"){
                return "red"
            } 
            else {
                return "light grey"
            }; 
        });

    // Do nodes after links so they are on top.
    var node = svg.append("g")
    .attr("class", "nodes")
    .selectAll("circle")
    .data(familyTreeData.nodes)
    .enter().append("circle")
    .attr("r", 5)
    .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Add a title to each node
    node.append("title")
        .text(function(d) { return d.id.toString().concat(" ", d.name, " ", d.dob); });
  

    var link2 = svg.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(familyTreeData.links)
    .enter().append("line")
    .attr("stroke", "black");

    
    console.log(node)

    // Function called on each tick to redraw the nodes and links
    function ticked() {

        // Draw the people
        node
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });    


        // Draw the marriage lines and the parents lines (these are hidden as the link2 lines are drawn from the middle of the marriage line instead)
        link
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        // Draw lines from the child to a line between the parents. These are not used in the simulation to keep the nodes in place.
        link2
            .attr("x1", function(d) { if(d.relationship == "mother") { return d.source.x;} })
            .attr("y1", function(d) { if(d.relationship == "mother") { return d.source.y;} })
            .attr("x2", function(d) {
                if(d.relationship == "mother") { 
                return d.target.x + (familyTreeData["nodes"].find(id => id.id == parents[d.source.id]["father"]).x - d.target.x)/2;
                }
            })
            .attr("y2", function(d) { 
                if(d.relationship == "mother") { 
                return d.target.y + (familyTreeData["nodes"].find(id => id.id == parents[d.source.id]["father"]).y - d.target.y)/2;
                }
            });    
    }
    
});


function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    //d.fy = d.y;
}

function dragged(d) {
    d.fx = d3.event.x;
    //d.fy = d3.event.y;
}

function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    //d.fy = null;
}


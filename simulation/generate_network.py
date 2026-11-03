"""
GreenCorridor AI - Module 8: SUMO Network & Configuration Generator
Generates XML definitions for a 4-intersection arterial urban grid.
"""

import os

def create_sumo_files(base_dir: str):
    net_dir = os.path.join(base_dir, "networks")
    rou_dir = os.path.join(base_dir, "routes")
    cfg_dir = os.path.join(base_dir, "configurations")

    os.makedirs(net_dir, exist_ok=True)
    os.makedirs(rou_dir, exist_ok=True)
    os.makedirs(cfg_dir, exist_ok=True)

    # 1. city.net.xml (Simplified valid SUMO network structure with 4 TLS junctions)
    net_xml = """<?xml version="1.0" encoding="UTF-8"?>
<net version="1.20" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <location netOffset="0.00,0.00" convBoundary="0.00,0.00,2400.00,600.00" origBoundary="77.5946,12.9716,77.6150,12.9830" projParameter="!"/>

    <!-- Edge Definitions -->
    <edge id="entry_w" from="node_w0" to="node_int1" priority="3" numLanes="2" speed="16.67"/>
    <edge id="edge_1_2" from="node_int1" to="node_int2" priority="3" numLanes="2" speed="16.67"/>
    <edge id="edge_2_3" from="node_int2" to="node_int3" priority="3" numLanes="2" speed="16.67"/>
    <edge id="edge_3_4" from="node_int3" to="node_int4" priority="3" numLanes="2" speed="16.67"/>
    <edge id="exit_hosp" from="node_int4" to="node_hosp" priority="3" numLanes="2" speed="16.67"/>

    <!-- Cross Traffic Edges -->
    <edge id="cross_1_n" from="node_1n" to="node_int1" priority="2" numLanes="1" speed="13.89"/>
    <edge id="cross_2_n" from="node_2n" to="node_int2" priority="2" numLanes="1" speed="13.89"/>
    <edge id="cross_3_n" from="node_3n" to="node_int3" priority="2" numLanes="1" speed="13.89"/>
    <edge id="cross_4_n" from="node_4n" to="node_int4" priority="2" numLanes="1" speed="13.89"/>

    <!-- Traffic Light Logics -->
    <tlLogic id="TLS_INT1" type="static" programID="0" offset="0">
        <phase duration="30" state="GGrr"/>
        <phase duration="3"  state="yyrr"/>
        <phase duration="2"  state="rrrr"/>
        <phase duration="25" state="rrGG"/>
        <phase duration="3"  state="rryy"/>
        <phase duration="2"  state="rrrr"/>
    </tlLogic>
    <tlLogic id="TLS_INT2" type="static" programID="0" offset="5">
        <phase duration="30" state="GGrr"/>
        <phase duration="3"  state="yyrr"/>
        <phase duration="2"  state="rrrr"/>
        <phase duration="25" state="rrGG"/>
        <phase duration="3"  state="rryy"/>
        <phase duration="2"  state="rrrr"/>
    </tlLogic>
    <tlLogic id="TLS_INT3" type="static" programID="0" offset="10">
        <phase duration="30" state="GGrr"/>
        <phase duration="3"  state="yyrr"/>
        <phase duration="2"  state="rrrr"/>
        <phase duration="25" state="rrGG"/>
        <phase duration="3"  state="rryy"/>
        <phase duration="2"  state="rrrr"/>
    </tlLogic>
    <tlLogic id="TLS_INT4" type="static" programID="0" offset="15">
        <phase duration="30" state="GGrr"/>
        <phase duration="3"  state="yyrr"/>
        <phase duration="2"  state="rrrr"/>
        <phase duration="25" state="rrGG"/>
        <phase duration="3"  state="rryy"/>
        <phase duration="2"  state="rrrr"/>
    </tlLogic>
</net>
"""
    with open(os.path.join(net_dir, "city.net.xml"), "w") as f:
        f.write(net_xml)

    # 2. city.rou.xml (Vehicle definitions and routes)
    rou_xml = """<?xml version="1.0" encoding="UTF-8"?>
<routes xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <!-- Vehicle Types -->
    <vType id="passenger_car" accel="2.6" decel="4.5" sigma="0.5" length="4.5" maxSpeed="15.0" color="blue"/>
    <vType id="bus" accel="1.2" decel="3.5" sigma="0.5" length="12.0" maxSpeed="12.0" color="yellow"/>
    <vType id="motorcycle" accel="3.0" decel="5.0" sigma="0.5" length="2.2" maxSpeed="16.0" color="green"/>
    <vType id="ambulance" accel="3.5" decel="5.5" sigma="0.0" length="6.5" maxSpeed="22.0" color="red" vClass="emergency"/>

    <!-- Main Arterial Route -->
    <route id="arterial_corridor" edges="entry_w edge_1_2 edge_2_3 edge_3_4 exit_hosp"/>

    <!-- Continuous Background Traffic Flow -->
    <flow id="flow_cars" type="passenger_car" begin="0" end="3600" probability="0.3" route="arterial_corridor"/>
    <flow id="flow_buses" type="bus" begin="0" end="3600" period="120" route="arterial_corridor"/>

    <!-- Emergency Vehicle Trip -->
    <vehicle id="AMB-001" type="ambulance" depart="10" route="arterial_corridor">
        <param key="has.bluelight.device" value="true"/>
    </vehicle>
</routes>
"""
    with open(os.path.join(rou_dir, "city.rou.xml"), "w") as f:
        f.write(rou_xml)

    # 3. city.sumocfg
    cfg_xml = """<?xml version="1.0" encoding="UTF-8"?>
<configuration xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <input>
        <net-file value="../networks/city.net.xml"/>
        <route-files value="../routes/city.rou.xml"/>
    </input>
    <time>
        <begin value="0"/>
        <end value="1000"/>
        <step-length value="0.5"/>
    </time>
    <processing>
        <collision.action value="none"/>
        <time-to-teleport value="-1"/>
    </processing>
</configuration>
"""
    with open(os.path.join(cfg_dir, "city.sumocfg"), "w") as f:
        f.write(cfg_xml)

    print("SUMO city network configuration generated successfully.")

if __name__ == "__main__":
    create_sumo_files(os.path.dirname(os.path.abspath(__file__)))
